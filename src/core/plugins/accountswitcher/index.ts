import { defineCorePlugin } from "..";
import { logger } from "@lib/utils/logger";

import AccountSwitcherSettings from "./settings";

export default defineCorePlugin({
    start() {
        logger.log("[AccountSwitcher] started");
    },
    stop() {
        logger.log("[AccountSwitcher] stopped");
    },
    SettingsComponent: AccountSwitcherSettings,
});
