import { defineCorePlugin } from "..";
import { fs } from "@lib/api/native";
import { BundleUpdaterManager } from "@lib/api/native/modules";
import { settings } from "@lib/api/settings";
import { logger } from "@lib/utils/logger";
import { React } from "@metro/common";
import { Stack, TableRow, TableRowGroup, TextInput } from "@metro/common/components";

const { ScrollView } = require("react-native");

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
        const cfg = getConfig();

        const update = (patch: Partial<ChatBubblesSettings>) => {
            settings.chatbubbles = { ...getConfig(), ...patch };
            writeBubbleConfig(true);
        };

        // Mirrors the Developer page pattern: uncontrolled inputs (defaultValue + size)
        // wrapped in a Stack inside the group. Putting a TextInput directly as a
        // TableRowGroup child, or making it controlled, crashes the redesign renderer.
        return React.createElement(
            ScrollView,
            null,
            React.createElement(
                Stack,
                { style: { paddingVertical: 24, paddingHorizontal: 12 }, spacing: 24 },
                React.createElement(
                    TableRowGroup,
                    { title: "Appearance" },
                    React.createElement(
                        Stack,
                        { spacing: 12, style: { padding: 12 } },
                        React.createElement(TextInput, {
                            size: "md",
                            label: "Avatar radius",
                            placeholder: "12",
                            defaultValue: String(cfg.avatarRadius),
                            keyboardType: "numeric",
                            onChange: (v: string) => update({ avatarRadius: Number(String(v).replace(/[^0-9]/g, "")) || 0 }),
                        }),
                        React.createElement(TextInput, {
                            size: "md",
                            label: "Bubble radius",
                            placeholder: "40",
                            defaultValue: String(cfg.bubbleRadius),
                            keyboardType: "numeric",
                            onChange: (v: string) => update({ bubbleRadius: Number(String(v).replace(/[^0-9]/g, "")) || 0 }),
                        }),
                        React.createElement(TextInput, {
                            size: "md",
                            label: "Bubble color",
                            placeholder: "#rrggbb or empty for default",
                            defaultValue: cfg.bubbleColor,
                            onChange: (v: string) => update({ bubbleColor: String(v) }),
                        }),
                    ),
                ),
                React.createElement(
                    TableRowGroup,
                    { title: "Apply" },
                    React.createElement(TableRow, {
                        label: "Reload to apply",
                        subLabel: "Bubbles are drawn natively, so changes apply after a reload.",
                        onPress: () => {
                            writeBubbleConfig(true).then(() => BundleUpdaterManager?.reload?.());
                        },
                    }),
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
