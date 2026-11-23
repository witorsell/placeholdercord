import { defineCorePlugin } from "..";
import { logger } from "@lib/utils/logger";

import AccountSwitcherSettings from "./settings";

export default defineCorePlugin({
    manifest: {
        id: "bunny.accountswitcher",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Account Switcher",
            description: "Save multiple Discord accounts and switch between them without logging out.",
            authors: [{ name: "witorsell", id: "1524888236382617681" }],
        },
    },

    SettingsComponent: AccountSwitcherSettings,

    start() {
        logger.log("[AccountSwitcher] started");
    },
    stop() {
        logger.log("[AccountSwitcher] stopped");
    },
});
