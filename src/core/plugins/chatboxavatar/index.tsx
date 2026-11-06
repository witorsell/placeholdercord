import { defineCorePlugin } from "..";
import { deleteJsxCreate, onJsxCreate } from "@lib/api/react/jsx";
import { logger } from "@lib/utils/logger";
import { findByNameLazy, findByProps, findByPropsLazy, findByStoreName } from "@metro";
import { React, ReactNative } from "@metro/common";

import ChatboxAvatarSettings from "./settings";
import { getChatboxAvatarConfig } from "./storage";

const { Pressable, Animated, View } = ReactNative;
const avatarCollapse = new Animated.Value(0);

const Flux = findByProps("useStateFromStores");
const Avatar = findByPropsLazy("default", "AvatarSizes", "getStatusSize")?.default;
const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");
const SelfPresenceStore = findByStoreName("SelfPresenceStore");
const DraftStore = findByStoreName("DraftStore");
const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const showYouAccountActionSheetByProp = findByPropsLazy("showYouAccountActionSheet");

function AvatarAction() {
    const config = getChatboxAvatarConfig();
    const self = Flux?.useStateFromStores?.([UserStore], () => UserStore?.getCurrentUser?.());
    const status = Flux?.useStateFromStores?.([SelfPresenceStore], () => SelfPresenceStore?.getStatus?.());
    const channelId = Flux?.useStateFromStores?.([SelectedChannelStore], () => SelectedChannelStore?.getCurrentlySelectedChannelId?.());
    const channel = Flux?.useStateFromStores?.([ChannelStore], () => ChannelStore?.getChannel?.(channelId), [channelId]);
    // The draft store holds what is typed in the box for the open channel; used to collapse the avatar.
    const textState = Boolean(
        Flux?.useStateFromStores?.([DraftStore], () => {
            try {
                return DraftStore?.getDraft?.(channelId, 0);
            } catch {
                return "";
            }
        }, [channelId]),
    );

    const animated = React.useRef(avatarCollapse).current;

    React.useEffect(() => {
        const shouldCollapse = config.collapseWhileTyping && textState;
        Animated.timing(animated, { toValue: shouldCollapse ? 1 : 0, duration: 200, useNativeDriver: false }).start();
    }, [textState, config.collapseWhileTyping, animated]);

    if (!self) return null;

    const openAccountSheet = () => {
        const fn = showYouAccountActionSheetByProp?.showYouAccountActionSheet;
        if (typeof fn === "function") {
            try {
                fn(true, true);
                return;
            } catch {}
        }
        showUserProfileActionSheet?.({ userId: self.id, channelId: channel?.id ?? channelId });
    };

    const doAction = (action: "profile" | "server") => {
        if (action === "profile") showUserProfileActionSheet?.({ userId: self.id, channelId: channel?.id ?? channelId });
        else if (action === "server") openAccountSheet();
    };

    return (
        <Animated.View
            style={{
                height: 40,
                width: animated.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
                marginHorizontal: animated.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }),
                flexShrink: 0,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                overflow: config.collapseWhileTyping ? "hidden" : "visible",
            }}
        >
            <Pressable
                onPress={() => doAction(config.pressAction)}
                onLongPress={() => doAction(config.longPressAction)}
            >
                {Avatar && (
                    <Avatar
                        user={self}
                        guildId={channel?.guild_id}
                        status={config.showStatusCutout ? status : undefined}
                        avatarDecoration={self?.avatarDecoration}
                        animate={!config.collapseWhileTyping || !textState}
                    />
                )}
            </Pressable>
        </Animated.View>
    );
}

let removeActionsHook: (() => void) | undefined;

export default defineCorePlugin({
    manifest: {
        id: "bunny.chatboxavatar",
        version: "1.0.0",
        type: "plugin",
        spec: 3,
        main: "",
        display: {
            name: "ChatboxAvatar",
            description: "Adds your avatar to the chatbox, with configurable press actions, a status cutout, and optional collapse while typing.",
            authors: [{ name: "witorsell", id: "1524888236382617681" }, { name: "rain (LampDelivery)" }],
        },
    },

    SettingsComponent: ChatboxAvatarSettings,

    start() {
        // ChatInputActions is memo(fn) on 352, so wrap its element in a row with our avatar.
        const cb = (_Component: any, ret: any) =>
            React.createElement(
                View,
                { style: { flexDirection: "row", alignItems: "center" } },
                ret,
                React.createElement(AvatarAction),
            );

        onJsxCreate("ChatInputActions", cb);
        removeActionsHook = () => deleteJsxCreate("ChatInputActions", cb);
        logger.log("[ChatboxAvatar] enabled");
    },

    stop() {
        removeActionsHook?.();
        removeActionsHook = undefined;
    },
});
