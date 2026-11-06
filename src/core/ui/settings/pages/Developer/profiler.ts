import { sendToNative } from "@core/plugins/nativebridge/transport";
import { clipboard } from "@metro/common";
import { showToast } from "@ui/toasts";

async function call(method: string, ...args: unknown[]) {
  const reply = await sendToNative({ Placeholder: { method, args } });
  if (reply?.error) throw new Error(String(reply.error));
  return reply?.result;
}

/**
 * Samples the Hermes JS thread for a few seconds and reports the hottest functions.
 * Scroll and tap around while it runs. The summary goes to the clipboard and to logcat.
 */
export async function profileJsThread(seconds = 10) {
  try {
    await call("profiler.start");
    showToast(`Profiling for ${seconds}s. Scroll and tap around now.`);
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

    const summary = String(await call("profiler.stop"));
    clipboard.setString(summary);

    const lines = summary.split("\n");
    for (let i = 0; i < lines.length; i += 12) {
      console.log(`[PlaceholderCord] profile\n${lines.slice(i, i + 12).join("\n")}`);
    }
    showToast("Profile copied to the clipboard.");
  } catch (e) {
    console.error("[PlaceholderCord] profiler failed:", e);
    showToast(`Profiler failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
