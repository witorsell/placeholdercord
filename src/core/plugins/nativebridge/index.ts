import { logger } from "@lib/utils/logger";

import { defineCorePlugin } from "..";
import { makeNative } from "./bridge";
import { sendToNative } from "./transport";

const native = makeNative(sendToNative);

declare global {
    interface Window {
        placeholder?: { native: typeof native };
    }
}

export default defineCorePlugin({
    manifest: {
        id: "bunny.nativebridge",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Native Bridge",
            description:
                "Exposes window.placeholder.native so plugins can call the native layer (bubbles, fs, reload). Off by default; enable it before using plugins that need it.",
            authors: [{ name: "witorsell", id: "1524888236382617681" }],
        },
    },

    start() {
        window.placeholder = { native };
        logger.log("[NativeBridge] window.placeholder.native ready");
    },

    stop() {
        delete window.placeholder;
        logger.log("[NativeBridge] window.placeholder removed");
    },
});
