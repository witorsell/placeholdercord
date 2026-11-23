import { defineCorePlugin } from "..";
import { showToast } from "@lib/ui/toasts";
import { findByProps, findByPropsLazy, findByStoreName } from "@metro";
import { FluxDispatcher, React, ReactNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup } from "@metro/common/components";

import { getSavedAccounts, removeAccount, saveAccount, SavedAccount } from "./storage";

const { View, Text, Pressable, Image, Alert } = ReactNative;
const UserStore = findByStoreName("UserStore");
const Flux = findByProps("useStateFromStores");
const tokens = findByPropsLazy("getToken");

function getCurrentToken(): string | null {
    try {
        return tokens?.getToken?.() ?? null;
    } catch {
        return null;
    }
}

function switchToAccount(account: SavedAccount) {
    try {
        FluxDispatcher.dispatch({
            type: "LOGIN_TOKEN",
            token: account.token,
            fingerprint: null,
        });
        showToast(`Switching to ${account.username}...`);
    } catch (e) {
        showToast("Switch failed");
        console.error("[AccountSwitcher] Switch failed:", e);
    }
}

export default function AccountSwitcherSettings() {
    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const currentUser = Flux?.useStateFromStores?.([UserStore], () => UserStore?.getCurrentUser?.());
    const accounts = getSavedAccounts();

    const handleSaveCurrent = () => {
        const token = getCurrentToken();
        if (!token || !currentUser) {
            showToast("No account to save");
            return;
        }

        saveAccount({
            token,
            username: currentUser.username,
            discriminator: currentUser.discriminator ?? "0",
            avatarUrl: currentUser.getAvatarURL?.({ size: 80 }) ?? null,
            id: currentUser.id,
        });
        showToast(`Saved ${currentUser.username}`);
        forceUpdate();
    };

    const handleSwitch = (account: SavedAccount) => {
        if (currentUser?.id === account.id) {
            showToast("Already on this account");
            return;
        }

        Alert.alert(
            "Switch Account",
            `Switch to ${account.username}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Switch",
                    onPress: () => switchToAccount(account),
                },
            ],
        );
    };

    const handleRemove = (account: SavedAccount) => {
        Alert.alert(
            "Remove Account",
            `Remove ${account.username} from saved accounts?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        removeAccount(account.id);
                        showToast(`Removed ${account.username}`);
                        forceUpdate();
                    },
                },
            ],
        );
    };

    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRowGroup title="Current Account">
                <TableRow
                    label={currentUser ? `${currentUser.username}${currentUser.discriminator && currentUser.discriminator !== "0" ? `#${currentUser.discriminator}` : ""}` : "Not logged in"}
                    subLabel={currentUser ? `ID: ${currentUser.id}` : undefined}
                    onPress={handleSaveCurrent}
                    trailing={
                        <Text style={{ color: "#5865F2", fontSize: 14, fontWeight: "600" }}>
                            {accounts.some(a => a.id === currentUser?.id) ? "Update" : "Save"}
                        </Text>
                    }
                />
            </TableRowGroup>

            <TableRowGroup title={`Saved Accounts (${accounts.length})`}>
                {accounts.length === 0 ? (
                    <TableRow
                        label="No saved accounts"
                        subLabel="Tap your current account above to save it"
                    />
                ) : (
                    accounts.map(account => (
                        <TableRow
                            key={account.id}
                            label={`${account.username}${account.discriminator && account.discriminator !== "0" ? `#${account.discriminator}` : ""}`}
                            subLabel={currentUser?.id === account.id ? "Currently active" : "Tap to switch"}
                            onPress={() => handleSwitch(account)}
                            onLongPress={() => handleRemove(account)}
                            trailing={
                                currentUser?.id === account.id ? (
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: "#3ba55c",
                                    }} />
                                ) : undefined
                            }
                        />
                    ))
                )}
            </TableRowGroup>
        </Stack>
    );
}
