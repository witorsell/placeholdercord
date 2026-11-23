import { defineCorePlugin } from "..";
import { FluxDispatcher } from "@metro/common";

import { saveCurrentAccount } from "./auth";
import AccountSwitcherSettings from "./settings";
import { patchAccountSheet } from "./sheet";
import { accountStoreReady, isAutoSaveEnabled } from "./storage";

const syncCurrentAccount = () => {
    if (isAutoSaveEnabled()) saveCurrentAccount();
};

let unpatchSheet: (() => void) | undefined;

export default defineCorePlugin({
    manifest: {
        id: "bunny.accountswitcher",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "Account Switcher",
            description: "Save accounts and switch between them without logging out.",
            authors: [{ name: "witorsell", id: "1524888236382617681" }],
        },
    },

    SettingsComponent: AccountSwitcherSettings,

    start() {
        FluxDispatcher.subscribe("CONNECTION_OPEN", syncCurrentAccount);
        accountStoreReady().then(syncCurrentAccount);
        unpatchSheet = patchAccountSheet();
    },

    stop() {
        FluxDispatcher.unsubscribe("CONNECTION_OPEN", syncCurrentAccount);
        unpatchSheet?.();
        unpatchSheet = undefined;
    },
});
