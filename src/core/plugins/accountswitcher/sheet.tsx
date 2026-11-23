import { before } from "@lib/api/patcher";
import { hideSheet } from "@lib/ui/sheets";
import { showToast } from "@lib/ui/toasts";
import { findByPropsLazy } from "@metro";
import { React, ReactNative } from "@metro/common";
import { TableRadioGroup, TableRadioRow, TableRow, TableRowGroup } from "@metro/common/components";

import AccountAvatar from "./AccountAvatar";
import { getCurrentAccount, openLoginForNewAccount, saveCurrentAccount, switchTo } from "./auth";
import { listAccounts } from "./storage";

const { Alert } = ReactNative;

const SHEET_KEY = "you-account-action-sheet-key";
const actionSheet = findByPropsLazy("openLazy", "hideActionSheet");

function AccountsSection() {
    // Rendered straight away so the sheet is measured with it. The store is initialised long before
    // anyone can open the sheet; if it somehow is not, skip the section instead of throwing.
    let accounts: ReturnType<typeof listAccounts>;
    try {
        accounts = listAccounts();
    } catch {
        return null;
    }

    const current = getCurrentAccount();

    const onSelect = (id: string) => {
        const account = accounts.find(a => a.id === id);
        if (!account || account.id === current?.id) return;
        hideSheet(SHEET_KEY);
        switchTo(account).catch(e => {
            console.error("[AccountSwitcher] switch failed", e);
            showToast(`Switch failed: ${e?.message ?? e}`);
        });
    };

    const onAdd = () =>
        Alert.alert(
            "Add account",
            "Your current account stays logged in and saved. You will land on the login screen, and the new account is saved when you sign in.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Continue",
                    onPress: () => {
                        saveCurrentAccount();
                        hideSheet(SHEET_KEY);
                        openLoginForNewAccount();
                    },
                },
            ],
        );

    return (
        <>
            {accounts.length > 0 && (
                <TableRadioGroup
                    title="Accounts"
                    hasIcons
                    value={current?.id ?? ""}
                    onChange={(id: string) => onSelect(id)}
                >
                    {accounts.map(account => (
                        <TableRadioRow
                            key={account.id}
                            value={account.id}
                            label={account.username}
                            icon={<AccountAvatar account={account} />}
                        />
                    ))}
                </TableRadioGroup>
            )}
            <TableRowGroup>
                <TableRow label="Add account" arrow onPress={onAdd} />
            </TableRowGroup>
        </>
    );
}

const wrapped = new WeakMap<object, any>();

// Discord's sheet renders ActionSheet > Stack > [sections]. The Stack's children are appended to, so
// whatever it already shows (status, custom status, its own accounts group when enabled) is untouched.
// The sheet's default export is React.memo(fn) on 352+, so unwrap it, wrap the inner function and
// memo it again.
function withAccounts(Original: any) {
    const isMemo = typeof Original === "object" && Original !== null;
    const inner = isMemo ? Original.type : Original;
    if (typeof inner !== "function") return Original;

    let Wrapped = wrapped.get(Original);
    if (!Wrapped) {
        const Component = function YouAccountActionSheetWithAccounts(props: any) {
            const ret = inner(props);
            const stack = ret?.props?.children;
            const sections = stack?.props?.children;
            if (stack?.props && Array.isArray(sections)) {
                stack.props.children = [...sections, <AccountsSection key="bunny-account-switcher" />];
            }
            return ret;
        };
        Wrapped = isMemo ? React.memo(Component, Original.compare ?? undefined) : Component;
        wrapped.set(Original, Wrapped);
    }
    return Wrapped;
}

// showYouAccountActionSheet opens the sheet with openLazy(importPromise, SHEET_KEY, props), so wrap
// the component when that import resolves.
export function patchAccountSheet() {
    return before("openLazy", actionSheet, (args: any[]) => {
        const [importer, key] = args;
        if (key !== SHEET_KEY || typeof importer?.then !== "function") return;

        const patched = importer.then((m: any) => (m?.default ? { ...m, default: withAccounts(m.default) } : m));
        return [patched, ...args.slice(1)];
    });
}
