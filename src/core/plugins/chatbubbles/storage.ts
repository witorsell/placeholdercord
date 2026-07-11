import { fs } from "@lib/api/native";
import { settings } from "@lib/api/settings";
import { logger } from "@lib/utils/logger";

export interface ChatBubblesConfig {
    avatarRadius: number;
    bubbleRadius: number;
    bubbleColor: string;
}

declare module "@lib/api/settings" {
    interface Settings {
        chatbubbles?: ChatBubblesConfig;
    }
}

export const DEFAULTS: ChatBubblesConfig = {
    avatarRadius: 12,
    bubbleRadius: 40,
    bubbleColor: "",
};

export function getChatBubblesConfig(): ChatBubblesConfig {
    return { ...DEFAULTS, ...(settings.chatbubbles ?? {}) };
}

// The native BubbleModule (PlaceholderXposed) reads files/pyoncord/bubbles.json on load.
// Written here; changes take effect after a reload, same model as rain's ChatBubbles.
export async function writeBubbleConfig(enabled: boolean) {
    const c = getChatBubblesConfig();
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

export function updateChatBubblesConfig(patch: Partial<ChatBubblesConfig>) {
    settings.chatbubbles = { ...getChatBubblesConfig(), ...patch };
    writeBubbleConfig(true);
}
