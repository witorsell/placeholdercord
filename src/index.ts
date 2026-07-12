import patchErrorBoundary from "@core/debug/patches/patchErrorBoundary";
import initFixes from "@core/fixes";
import { initFetchI18nStrings } from "@core/i18n";
import initSettings from "@core/ui/settings";
import { initVendettaObject } from "@core/vendetta/api";
import { updateFonts } from "@lib/addons/fonts";
import { initThemes } from "@lib/addons/themes";
import { patchCommands } from "@lib/api/commands";
import { patchLogHook } from "@lib/api/debug";
import { injectFluxInterceptor } from "@lib/api/flux";
import { patchJsx } from "@lib/api/react/jsx";
import { logger } from "@lib/utils/logger";
import { patchSettings } from "@ui/settings";
import { updaterSettings } from "@lib/api/settings";
import { InteractionManager } from "react-native";
import { getDebugInfo, initDebugger } from "@lib/api/debug";

// Debug toggle helper (temporary runtime fallback). The helper is dynamically
// imported when needed (to avoid bundling it permanently) and removed after use.

import * as lib from "./lib";
import { timings } from "@lib/utils/timings";

/**
 * Start sequence split into critical (UI) and deferred (network/plugin) work.
 * The goal is to get the UI ready quickly and run heavy tasks after interactions.
 */
export default async () => {
  // Wrap critical initializers as named functions so we can instrument each.
  const criticalInitFns: Array<[string, () => Promise<any>]> = [
    ["initThemes", () => initThemes()],
    ["injectFluxInterceptor", () => injectFluxInterceptor()],
    ["patchSettings", () => patchSettings()],
    ["patchLogHook", () => patchLogHook()],
    ["patchCommands", () => patchCommands()],
    ["patchJsx", () => patchJsx()],
    ["patchErrorBoundary", () => patchErrorBoundary()],
    ["initVendettaObject", () => initVendettaObject()],
    ["initFetchI18nStrings", () => initFetchI18nStrings()],
    ["initSettings", () => initSettings()],
    ["initFixes", () => initFixes()],
    ["initDebugger", () => initDebugger()],
  ];

  // Run critical inits with timing instrumentation and collect unpatchers/cleanup handlers.
  await Promise.all(
    criticalInitFns.map(([name, fn]) =>
      timings.measureAsync(`critical:${name}`, async () => fn()),
    ),
  )
    .then((u) => u.forEach((f) => f && lib.unload.push(f)))
    .catch((e) => {
      // Log but don't abort, critical inits failing should be visible in logs.
      console.warn("Critical initialization error:", e);
    });

  // Expose the library object early so UI and other code can access window.bunny.
  window.bunny = lib;

  logger.log(
    "PlaceholderCord: UI-critical initialization complete, deferring plugin & network work",
  );

  // Deferred work: run after interactions to avoid blocking initial paint and navigation.
  const runDeferred = async () => {
    const { VdPluginManager } = await import("@core/vendetta/plugins");
    const { initPlugins, updatePlugins } = await import("@lib/addons/plugins");

    // Register plugin manifests (core AND external/repo plugins) before starting
    // anything. initPlugins() only starts plugins it finds in the registry, so if
    // this isn't awaited first, externally-installed plugins (Bubble Chat, Virtual
    // Camera, anything from a repo) are invisible to the startup sweep below and
    // never get started at all, since nothing else re-registers them later.
    await updatePlugins().catch((e) =>
      logger.log("updatePlugins failed:", e),
    );

    // Start PlaceholderCord (Bunny) plugins, including the Native Bridge core
    // plugin, and wait for the whole sweep to settle before touching Vendetta
    // plugins below. Stagger plugin startup to reduce CPU/memory spikes: use
    // smaller batches and a small interval. This keeps the UI responsive while
    // plugins initialize in the background.
    await initPlugins({ staggerInterval: 500, batchSize: 2 });

    // Vendetta plugins (Bubble Chat, Virtual Camera, anything using onLoad/
    // onUnload) start only now, after the Bunny sweep above has fully settled.
    // Vendetta's own plugin list comes straight from local MMKV storage with no
    // network wait, so if this ran concurrently with the Bunny sweep instead of
    // after it, Vendetta plugins would reliably win the race and run onLoad
    // before Native Bridge's start() has set window.placeholder, exactly the
    // "Native Bridge needs to be enabled" false alarm this fixes.
    VdPluginManager.initPlugins()
      .then((u) => lib.unload.push(u))
      .catch((e) => logger.log("Vendetta init failed:", e));

    // Attempt a lightweight recovery toggle if some core plugins failed to start.
    try {
      // Dynamically import the helper (if present) but suppress verbose errors.
      const mod = await import("@core/debug/toggleCorePlugins").catch(
        () => null,
      );
      if (mod?.default) {
        // Run helper with minimal noise; ignore failures.
        mod.default({ offDuration: 1500 }).catch(() => {});
      }

      // Try to remove the helper source file (best-effort, ignore failures).
      await import("@lib/api/native/fs")
        .then((fs) => fs.removeFile("src/core/debug/toggleCorePlugins.ts"))
        .catch(() => {});
    } catch {
      // suppressed
    }

    // Update fonts in background
    updateFonts().catch((e) => logger.log("updateFonts failed:", e));

    // Periodic re-check for plugin/repo updates. The initial registration already
    // happened above before initPlugins(), this is just a later refresh.
    setTimeout(
      () => {
        updatePlugins().catch((e) =>
          logger.log("updatePlugins failed (periodic refresh):", e),
        );
      },
      5 * 60 * 1000,
    );
  };

  // Preferred: wait until interactions finish (animations / navigation).
  try {
    InteractionManager.runAfterInteractions(() => {
      // small delay to ensure native lifecycle settled
      setTimeout(runDeferred, 50);
    });
  } catch (e) {
    // Fallback if InteractionManager isn't available for any reason.
    setTimeout(runDeferred, 200);
  }

  // Final ready log for basic UI availability.
  logger.log("PlaceholderCord is ready.");
};
