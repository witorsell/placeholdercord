import { BundleUpdaterManager } from "@lib/api/native/modules";
import { findByName } from "@metro";
import { React } from "@metro/common";
import { Stack, TableRadioGroup, TableRadioRow, TableRowGroup, TextInput } from "@metro/common/components";

import { getChatBubblesConfig, updateChatBubblesConfig, writeBubbleConfig } from "./storage";

const { Pressable, Text, View } = require("react-native");

// Discord's native color picker action sheet (same one FPTE-FIXED uses). Try both the
// default-export and raw-export forms since finders differ across builds.
const _picker: any = findByName("showCustomColorPickerActionSheet")
    ?? findByName("showCustomColorPickerActionSheet", false);
const showColorPicker: (props: any) => void =
    typeof _picker === "function" ? _picker
    : typeof _picker?.default === "function" ? _picker.default
    : () => undefined;

const hexToInt = (hex: string): number => {
    const n = parseInt((hex || "").replace(/[^0-9a-fA-F]/g, ""), 16);
    return Number.isNaN(n) ? 0 : n & 0xFFFFFF;
};
const intToHex = (n: number): string => "#" + (n & 0xFFFFFF).toString(16).padStart(6, "0");

export default function ChatBubblesSettings() {
    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const cfg = getChatBubblesConfig();

    const set = (patch: Parameters<typeof updateChatBubblesConfig>[0]) => {
        updateChatBubblesConfig(patch);
        forceUpdate();
    };

    const openPicker = () => showColorPicker({
        color: hexToInt(cfg.bubbleColor),
        suggestedColors: ["#000000", "#1e1f22", "#5865F2", "#248046", "#DA373C"],
        onSelect: (c: number) => set({ bubbleColor: intToHex(c) }),
    });

    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRadioGroup
                title="Avatar Corners"
                value={String(cfg.avatarRadius)}
                onChange={(v: string) => set({ avatarRadius: Number(v) })}
            >
                <TableRadioRow value="0" label="Square" />
                <TableRadioRow value="15" label="Slightly rounded" />
                <TableRadioRow value="30" label="Rounded" />
                <TableRadioRow value="50" label="Circle" />
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ flexGrow: 1 }}>
                            <TextInput
                                size="md"
                                placeholder="#rrggbb (empty = default)"
                                defaultValue={cfg.bubbleColor}
                                onChange={(v: string) => set({ bubbleColor: v })}
                            />
                        </View>
                        <Pressable
                            onPress={openPicker}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#555",
                                backgroundColor: cfg.bubbleColor || "#000000",
                            }}
                        />
                    </View>
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
