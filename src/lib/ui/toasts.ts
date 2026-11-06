import { Strings } from "@core/i18n";
import { findAssetId } from "@lib/api/assets";
import { lazyDestructure } from "@lib/utils/lazy";
import { toasts } from "@metro/common";
import { findByProps } from "@metro/wrappers";

const { uuid4 } = lazyDestructure(() => findByProps("uuid4"));

function safeUuid4(): string {
    try {
        const fn = (uuid4 as any)();
        return typeof fn === "string" ? fn : "vd-toast-fallback-" + Math.random().toString(36).slice(2, 8);
    } catch (_) {
        return "vd-toast-fallback-" + Math.random().toString(36).slice(2, 8);
    }
}

export const showToast = (content: string, asset?: number) => {
    try {
        const toastModule = toasts as any;
        if (!toastModule || typeof toastModule.open !== "function") {
            console.warn("[PlaceholderCord] Toast module not resolved; skipping toast:", content);
            return;
        }
        const key = `vd-toast-${safeUuid4()}`;

        // Discord 352 changed open() to (key, toast) and the toast entry to { text, icon, ... }.
        // Passing the old single object leaves the entry without a toast, and the container then
        // throws reading toast.position and takes the whole screen down. The new icon is a
        // component rather than an asset id, so it is left out there.
        if (toastModule.open.length >= 2) {
            toastModule.open(key, { text: content });
        } else {
            toastModule.open({ key, content, icon: asset });
        }
    } catch (e) {
        console.warn("[PlaceholderCord] Toast failed:", content, e);
    }
};

showToast.showCopyToClipboard = (message = Strings.COPIED_TO_CLIPBOARD) => {
    try {
        showToast(message, findAssetId("toast_copy_link"));
    } catch (e) {
        console.warn("[PlaceholderCord] Toast (clipboard) failed:", message, e);
    }
};
