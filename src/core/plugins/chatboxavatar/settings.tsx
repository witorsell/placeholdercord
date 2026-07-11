import { findByProps } from "@metro";
import { React } from "@metro/common";

import { getChatboxAvatarConfig, updateChatboxAvatarConfig } from "./storage";

const { Text } = require("react-native");

export default function ChatboxAvatarSettings() {
    // Resolve real component objects instead of the @metro/common/components proxyLazy
    // exports, which crash ("target is not callable") when React renders a forwardRef
    // component through the function-proxy.
    const UI = findByProps("TableRadioGroup", "TableRadioRow", "Stack") ?? {};
    const { Stack, TableRadioGroup, TableRadioRow } = UI;

    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const config = getChatboxAvatarConfig();

    if (!Stack || !TableRadioGroup || !TableRadioRow) {
        return React.createElement(Text, { style: { color: "#888", padding: 16 } },
            "ChatboxAvatar settings components could not be found on this Discord build.");
    }

    const set = (patch: Parameters<typeof updateChatboxAvatarConfig>[0]) => {
        updateChatboxAvatarConfig(patch);
        forceUpdate();
    };

    const group = (
        title: string,
        value: string,
        options: Array<{ value: string; label: string }>,
        onChange: (v: string) => void,
    ) => React.createElement(
        TableRadioGroup,
        { title, value, onChange },
        ...options.map(o => React.createElement(TableRadioRow, { key: o.value, value: o.value, label: o.label })),
    );

    return React.createElement(
        Stack,
        { style: { padding: 16 }, spacing: 16 },
        group("Avatar Press Action", config.pressAction, [
            { value: "profile", label: "Open Profile" },
            { value: "server", label: "Open Status Picker" },
        ], v => set({ pressAction: v as "profile" | "server" })),
        group("Avatar Long-Press Action", config.longPressAction, [
            { value: "profile", label: "Open Profile" },
            { value: "server", label: "Open Status Picker" },
        ], v => set({ longPressAction: v as "profile" | "server" })),
        group("Status Icon", config.showStatusCutout ? "true" : "false", [
            { value: "true", label: "Show" },
            { value: "false", label: "Hide" },
        ], v => set({ showStatusCutout: v === "true" })),
        group("Collapse While Typing", config.collapseWhileTyping ? "true" : "false", [
            { value: "true", label: "Collapse avatar while typing" },
            { value: "false", label: "Always show avatar" },
        ], v => set({ collapseWhileTyping: v === "true" })),
    );
}
