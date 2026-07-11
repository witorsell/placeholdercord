import { defineCorePlugin } from "..";
import { fs } from "@lib/api/native";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { settings } from "@lib/api/settings";
import { logger } from "@lib/utils/logger";
import { findByProps } from "@metro";
import { React } from "@metro/common";

const { ScrollView, Text, Pressable } = require("react-native");

interface ChatBubblesSettings {
    avatarRadius: number;
    bubbleRadius: number;
    bubbleColor: string;
}

declare module "@lib/api/settings" {
    interface Settings {
        chatbubbles?: ChatBubblesSettings;
    }
}

const DEFAULTS: ChatBubblesSettings = {
    avatarRadius: 12,
    bubbleRadius: 40,
    bubbleColor: "",
};

function getConfig(): ChatBubblesSettings {
    return { ...DEFAULTS, ...(settings.chatbubbles ?? {}) };
}

// The native BubbleModule (PlaceholderXposed) reads files/pyoncord/bubbles.json on load.
// We write it here; changes take effect after a reload, same as rain's ChatBubbles.
async function writeBubbleConfig(enabled: boolean) {
    const c = getConfig();
    const payload = {
        enabled,
        avatarRadius: Number(c.avatarRadius) || 0,
        bubbleRadius: Number(c.bubbleRadius) || 0,
        bubbleColor: (c.bubbleColor ?? "").trim(),
    };
    try {
        await fs.writeFile("bubbles.json", JSON.stringify(payload));
    } catch (e) {
        logger.error("[ChatBubbles] failed to write bubbles.json:", e);
    }
}

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
            authors: [{ name: "PlaceholderCord" }, { name: "rain (original)" }],
        },
    },

    SettingsComponent() {
        // Resolve the real component objects (findByProps), NOT the @metro/common/components
        // proxyLazy exports: those present as callable functions, and React calling a
        // forwardRef/memo object through the proxy throws "target is not callable".
        const UI = findByProps("TableRadioGroup", "TableRadioRow", "Stack") ?? {};
        const { TableRadioGroup, TableRadioRow, Stack } = UI;

        const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
        const cfg = getConfig();

        if (!TableRadioGroup || !TableRadioRow || !Stack) {
            return React.createElement(Text, { style: { color: "#888", padding: 16 } },
                "ChatBubbles settings components could not be found on this Discord build.");
        }

        const update = (patch: Partial<ChatBubblesSettings>) => {
            settings.chatbubbles = { ...getConfig(), ...patch };
            writeBubbleConfig(true);
            forceUpdate();
        };

        // Only uses components confirmed to resolve in this build (Stack / TableRadioGroup /
        // TableRadioRow) plus RN primitives. TextInput (findSingular) resolves to undefined
        // here and crashes the renderer, so appearance is chosen from presets instead.
        const radio = (
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
            ScrollView,
            null,
            React.createElement(
                Stack,
                { style: { padding: 16 }, spacing: 16 },
                radio("Avatar Corners", String(cfg.avatarRadius), [
                    { value: "0", label: "Square" },
                    { value: "8", label: "Slightly rounded" },
                    { value: "12", label: "Rounded" },
                    { value: "24", label: "Circle" },
                ], v => update({ avatarRadius: Number(v) })),
                radio("Bubble Corners", String(cfg.bubbleRadius), [
                    { value: "8", label: "Subtle" },
                    { value: "16", label: "Rounded" },
                    { value: "24", label: "Very rounded" },
                    { value: "40", label: "Pill" },
                ], v => update({ bubbleRadius: Number(v) })),
                radio("Bubble Color", cfg.bubbleColor || "", [
                    { value: "", label: "Default (translucent black)" },
                    { value: "#1e1f22", label: "Dark" },
                    { value: "#5865F2", label: "Blurple" },
                    { value: "#248046", label: "Green" },
                    { value: "#DA373C", label: "Red" },
                ], v => update({ bubbleColor: v })),
                React.createElement(
                    Pressable,
                    {
                        onPress: () => writeBubbleConfig(true).then(() => BundleUpdaterManager?.reload?.()),
                        style: { paddingVertical: 12, alignItems: "center" },
                    },
                    React.createElement(Text, { style: { color: "#5865F2", fontSize: 16, fontWeight: "600" } }, "Reload to apply"),
                ),
                React.createElement(
                    Text,
                    { style: { color: "#888", textAlign: "center", paddingHorizontal: 16 } },
                    "Bubbles are drawn natively, so changes apply after a reload.",
                ),
            ),
        );
    },

    start() {
        settings.chatbubbles = getConfig();
        writeBubbleConfig(true);
        logger.log("[ChatBubbles] enabled");
    },

    stop() {
        writeBubbleConfig(false);
        logger.log("[ChatBubbles] disabled (reload to remove bubbles)");
    },
});
