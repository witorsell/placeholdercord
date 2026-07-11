import { settings } from "@lib/api/settings";

export interface ChatboxAvatarConfig {
    pressAction: "profile" | "server";
    longPressAction: "profile" | "server";
    showStatusCutout: boolean;
    collapseWhileTyping: boolean;
}

declare module "@lib/api/settings" {
    interface Settings {
        chatboxavatar?: ChatboxAvatarConfig;
    }
}

export const DEFAULTS: ChatboxAvatarConfig = {
    pressAction: "profile",
    longPressAction: "server",
    showStatusCutout: false,
    collapseWhileTyping: false,
};

export function getChatboxAvatarConfig(): ChatboxAvatarConfig {
    return { ...DEFAULTS, ...(settings.chatboxavatar ?? {}) };
}

export function updateChatboxAvatarConfig(patch: Partial<ChatboxAvatarConfig>) {
    settings.chatboxavatar = { ...getChatboxAvatarConfig(), ...patch };
}
