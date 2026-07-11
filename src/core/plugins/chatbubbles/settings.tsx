import { BundleUpdaterManager } from "@lib/api/native/modules";
import { React } from "@metro/common";
import { Stack, TableRadioGroup, TableRadioRow, TableRowGroup, TextInput } from "@metro/common/components";

import { getChatBubblesConfig, updateChatBubblesConfig, writeBubbleConfig } from "./storage";

const { Pressable, Text } = require("react-native");

export default function ChatBubblesSettings() {
    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const cfg = getChatBubblesConfig();

    const set = (patch: Parameters<typeof updateChatBubblesConfig>[0]) => {
        updateChatBubblesConfig(patch);
        forceUpdate();
    };

    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRadioGroup
                title="Avatar Corners"
                value={String(cfg.avatarRadius)}
                onChange={(v: string) => set({ avatarRadius: Number(v) })}
            >
                <TableRadioRow value="0" label="Square" />
                <TableRadioRow value="8" label="Slightly rounded" />
                <TableRadioRow value="12" label="Rounded" />
                <TableRadioRow value="24" label="Circle" />
            </TableRadioGroup>

            <TableRadioGroup
                title="Bubble Corners"
                value={String(cfg.bubbleRadius)}
                onChange={(v: string) => set({ bubbleRadius: Number(v) })}
            >
                <TableRadioRow value="8" label="Subtle" />
                <TableRadioRow value="16" label="Rounded" />
                <TableRadioRow value="24" label="Very rounded" />
                <TableRadioRow value="40" label="Pill" />
            </TableRadioGroup>

            <TableRowGroup title="Bubble Color">
                <Stack spacing={8} style={{ padding: 12 }}>
                    <TextInput
                        size="md"
                        placeholder="#rrggbb (leave empty for default)"
                        defaultValue={cfg.bubbleColor}
                        onChange={(v: string) => set({ bubbleColor: v })}
                    />
                </Stack>
            </TableRowGroup>

            <Pressable
                onPress={() => writeBubbleConfig(true).then(() => BundleUpdaterManager?.reload?.())}
                style={{ paddingVertical: 12, alignItems: "center" }}
            >
                <Text style={{ color: "#5865F2", fontSize: 16, fontWeight: "600" }}>Reload to apply</Text>
            </Pressable>
        </Stack>
    );
}
