import { React } from "@metro/common";
import { Stack, TableRadioGroup, TableRadioRow } from "@metro/common/components";

import { getChatboxAvatarConfig, updateChatboxAvatarConfig } from "./storage";

export default function ChatboxAvatarSettings() {
    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const config = getChatboxAvatarConfig();

    const set = (patch: Parameters<typeof updateChatboxAvatarConfig>[0]) => {
        updateChatboxAvatarConfig(patch);
        forceUpdate();
    };

    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRadioGroup
                title="Avatar Press Action"
                value={config.pressAction}
                onChange={(v: string) => set({ pressAction: v as "profile" | "server" })}
            >
                <TableRadioRow value="profile" label="Open Profile" />
                <TableRadioRow value="server" label="Open Status Picker" />
            </TableRadioGroup>

            <TableRadioGroup
                title="Avatar Long-Press Action"
                value={config.longPressAction}
                onChange={(v: string) => set({ longPressAction: v as "profile" | "server" })}
            >
                <TableRadioRow value="profile" label="Open Profile" />
                <TableRadioRow value="server" label="Open Status Picker" />
            </TableRadioGroup>

            <TableRadioGroup
                title="Status Icon"
                value={config.showStatusCutout ? "true" : "false"}
                onChange={(v: string) => set({ showStatusCutout: v === "true" })}
            >
                <TableRadioRow value="true" label="Show" />
                <TableRadioRow value="false" label="Hide" />
            </TableRadioGroup>

            <TableRadioGroup
                title="Collapse While Typing"
                value={config.collapseWhileTyping ? "true" : "false"}
                onChange={(v: string) => set({ collapseWhileTyping: v === "true" })}
            >
                <TableRadioRow value="true" label="Collapse avatar while typing" />
                <TableRadioRow value="false" label="Always show avatar" />
            </TableRadioGroup>
        </Stack>
    );
}
