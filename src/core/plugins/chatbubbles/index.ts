import { defineCorePlugin } from "..";
import { logger } from "@lib/utils/logger";

import ChatBubblesSettings from "./settings";
import { getChatBubblesConfig, writeBubbleConfig } from "./storage";

export default defineCorePlugin({
    manifest: {
        id: "bunny.chatbubbles",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "ChatBubbles",
            description: "Wraps messages in rounded chat bubbles with a rounded avatar. Drawn natively by PlaceholderXposed; toggle and restyle here.",
            authors: [{ name: "witorsell", id: "1524888236382617681" }, { name: "rain (original)" }],
        },
    },

    SettingsComponent: ChatBubblesSettings,

    start() {
        getChatBubblesConfig();
        writeBubbleConfig(true);
        logger.log("[ChatBubbles] enabled");
    },

    stop() {
        writeBubbleConfig(false);
        logger.log("[ChatBubbles] disabled (reload to remove bubbles)");
    },
});
