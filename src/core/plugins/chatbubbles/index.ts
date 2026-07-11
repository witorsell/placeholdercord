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
        const { useState } = React;
        const [cfg, setCfg] = useState<ChatBubblesSettings>(getConfig());

        const update = (patch: Partial<ChatBubblesSettings>) => {
            const next = { ...cfg, ...patch };
            setCfg(next);
            settings.chatbubbles = next;
            writeBubbleConfig(true);
        };

        return React.createElement(
            ScrollView,
            null,
            React.createElement(
                Stack,
                { spacing: 16, style: { padding: 12 } },
                React.createElement(
                    TableRowGroup,
                    { title: "Appearance" },
                    React.createElement(TextInput, {
                        label: "Avatar radius",
                        value: String(cfg.avatarRadius),
                        keyboardType: "numeric",
                        placeholder: "12",
                        onChange: (v: string) => update({ avatarRadius: Number(v.replace(/[^0-9]/g, "")) || 0 }),
                    }),
                    React.createElement(TextInput, {
                        label: "Bubble radius",
                        value: String(cfg.bubbleRadius),
                        keyboardType: "numeric",
                        placeholder: "40",
                        onChange: (v: string) => update({ bubbleRadius: Number(v.replace(/[^0-9]/g, "")) || 0 }),
                    }),
                    React.createElement(TextInput, {
                        label: "Bubble color",
                        value: cfg.bubbleColor,
                        placeholder: "#rrggbb or empty for default",
                        isClearable: true,
                        onChange: (v: string) => update({ bubbleColor: v }),
                    }),
                ),
                React.createElement(
                    TableRowGroup,
                    { title: "Apply" },
                    React.createElement(TableRow, {
                        label: "Reload to apply",
                        subLabel: "Bubbles are drawn natively, so changes apply after a reload.",
                        onPress: () => {
                            writeBubbleConfig(true).then(() => BundleUpdaterManager.reload());
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
