import { defineCorePlugin } from "..";
import { after } from "@lib/api/patcher";
import { logger } from "@lib/utils/logger";
import { factories, findByNameLazy, findByProps, findByPropsLazy, findByStoreName, findExports } from "@metro";
import { React, ReactNative } from "@metro/common";

import ChatboxAvatarSettings from "./settings";
import { getChatboxAvatarConfig } from "./storage";

// This stack's byTypeName matches `type.name` (minified in Discord); rain relies on
// `type.displayName`, so build that finder explicitly.
const byTypeDisplayName = factories.createFilterDefinition<[string]>(
    ([name], m) => m?.type?.displayName === name,
    name => `chatboxavatar.byTypeDisplayName(${name})`,
);

const { Pressable, Animated, View } = ReactNative;
const avatarCollapse = new Animated.Value(0);

let hasText = false;
let sendBtnRef: { setHasText?: (v: boolean) => void } | undefined;

const Flux = findByProps("useStateFromStores");
const Avatar = findByPropsLazy("default", "AvatarSizes", "getStatusSize")?.default;
const UserStore = findByStoreName("UserStore");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const ChannelStore = findByStoreName("ChannelStore");
const SelfPresenceStore = findByStoreName("SelfPresenceStore");
const showUserProfileActionSheet = findByNameLazy("showUserProfileActionSheet");
const showYouAccountActionSheetByProp = findByPropsLazy("showYouAccountActionSheet");

function AvatarAction() {
    const [textState, setTextState] = React.useState(false);
    const config = getChatboxAvatarConfig();
    const self = Flux?.useStateFromStores?.([UserStore], () => UserStore?.getCurrentUser?.());
    const status = Flux?.useStateFromStores?.([SelfPresenceStore], () => SelfPresenceStore?.getStatus?.());
    const channelId = Flux?.useStateFromStores?.([SelectedChannelStore], () => SelectedChannelStore?.getCurrentlySelectedChannelId?.());
    const channel = Flux?.useStateFromStores?.([ChannelStore], () => ChannelStore?.getChannel?.(channelId), [channelId]);

    const animated = React.useRef(avatarCollapse).current;

    React.useEffect(() => {
        const interval = setInterval(() => setTextState(hasText), 100);
        return () => clearInterval(interval);
    }, []);

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

let ChatInputActions: any;
let ChatInputSendButton: any;
const unpatches: (() => void)[] = [];

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
            authors: [{ name: "PlaceholderCord" }, { name: "rain (LampDelivery)" }],
        },
    },

    SettingsComponent: ChatboxAvatarSettings,

    start() {
        ChatInputActions ??= findExports(byTypeDisplayName("ChatInputActions"));
        ChatInputSendButton ??= findExports(byTypeDisplayName("ChatInputSendButton"));
        if (!ChatInputActions?.type || !ChatInputSendButton?.type) {
            logger.error("[ChatboxAvatar] could not find ChatInputActions/ChatInputSendButton");
            return;
        }

        unpatches.push(after("render", ChatInputActions.type, (_args, ret) => {
            return React.createElement(
                View,
                { style: { flexDirection: "row", alignItems: "center" } },
                ret,
                React.createElement(AvatarAction),
            );
        }));

        unpatches.push(after("render", ChatInputSendButton.type, (args) => {
            setImmediate(() => setImmediate(() => {
                if (args?.[1]?.current) {
                    sendBtnRef = args[1].current;
                    const orig = sendBtnRef?.setHasText;
                    unpatches.push(() => { if (sendBtnRef && orig) sendBtnRef.setHasText = orig; });
                    if (sendBtnRef) {
                        sendBtnRef.setHasText = (v: boolean) => {
                            hasText = v;
                            if (orig) return orig.call(sendBtnRef, v);
                        };
                    }
                }
            }));
        }));

        logger.log("[ChatboxAvatar] enabled");
    },

    stop() {
        for (const u of unpatches) u?.();
        unpatches.length = 0;
    },
});
