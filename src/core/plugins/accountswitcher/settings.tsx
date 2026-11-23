import { showToast } from "@lib/ui/toasts";
import { findByStoreName } from "@metro";
import { React, ReactNative } from "@metro/common";
import { Stack, TableRow, TableRowGroup, TableSwitchRow } from "@metro/common/components";

import { avatarUrl, getCurrentAccount, openLoginForNewAccount, saveCurrentAccount, switchTo } from "./auth";
import { accountStoreReady, isAutoSaveEnabled, listAccounts, removeAccount, SavedAccount, setAutoSave } from "./storage";

const { Alert, Image, View } = ReactNative;

function AccountAvatar({ account }: { account: SavedAccount; }) {
    const uri = avatarUrl(account);
    return uri
        ? <Image source={{ uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
        : <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#4e5058" }} />;
}

export default function AccountSwitcherSettings() {
    const [, forceUpdate] = React.useReducer((x: number) => ~x, 0);
    const [ready, setReady] = React.useState(false);

    React.useEffect(() => {
        accountStoreReady().then(() => {
            saveCurrentAccount();
            setReady(true);
        });
    }, []);

    if (!ready) return null;

    const current = getCurrentAccount();
    const accounts = listAccounts();
    const label = (a: SavedAccount) => a.username;

    const confirm = (title: string, body: string, action: string, onConfirm: () => void, destructive = false) =>
        Alert.alert(title, body, [
            { text: "Cancel", style: "cancel" },
            { text: action, style: destructive ? "destructive" : "default", onPress: onConfirm },
        ]);

    const doSwitch = (account: SavedAccount) =>
        switchTo(account).catch(e => {
            console.error("[AccountSwitcher] switch failed", e);
            showToast(`Switch failed: ${e?.message ?? e}`);
        });

    const onPressAccount = (account: SavedAccount) => {
        const isCurrent = current?.id === account.id;
        Alert.alert(label(account), isCurrent ? "This is the account you are on." : undefined, [
            ...(isCurrent ? [] : [{ text: "Switch", onPress: () => doSwitch(account) }]),
            { text: "Remove", style: "destructive" as const, onPress: () => onRemove(account) },
            { text: "Cancel", style: "cancel" as const },
        ]);
    };

    const onAdd = () => {
        confirm(
            "Add account",
            "Your current account is saved and stays logged in on Discord's side. You will land on the login screen, and the new account is saved when you sign in.",
            "Continue",
            () => {
                saveCurrentAccount();
                openLoginForNewAccount();
            },
        );
    };

    const onRemove = (account: SavedAccount) =>
        confirm("Remove account", `Forget ${label(account)}? This only deletes the saved token here.`, "Remove", () => {
            removeAccount(account.id);
            forceUpdate();
        }, true);

    return (
        <Stack style={{ padding: 16 }} spacing={16}>
            <TableRowGroup title="Accounts">
                {accounts.length === 0 && <TableRow label="No saved accounts" />}
                {accounts.map(account => (
                    <TableRow
                        key={account.id}
                        label={label(account)}
                        subLabel={current?.id === account.id ? "Current account" : "Tap to switch or remove"}
                        icon={<AccountAvatar account={account} />}
                        onPress={() => onPressAccount(account)}
                    />
                ))}
            </TableRowGroup>

            <TableRowGroup title="Add">
                <TableRow
                    label="Add account"
                    subLabel="Keeps this account logged in, opens the login screen"
                    onPress={onAdd}
                />
            </TableRowGroup>

            <TableRowGroup title="Options">
                <TableSwitchRow
                    label="Save accounts automatically"
                    subLabel="Store the token of whichever account you sign in with"
                    value={isAutoSaveEnabled()}
                    onValueChange={(v: boolean) => {
                        setAutoSave(v);
                        forceUpdate();
                    }}
                />
            </TableRowGroup>
        </Stack>
    );
}
