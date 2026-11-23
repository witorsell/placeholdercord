import { findByProps, findByStoreName } from "@metro";
import { FluxDispatcher } from "@metro/common";

import { SavedAccount, upsertAccount } from "./storage";

// Discord's own multi-account switch. It dispatches a local LOGOUT (isSwitchingAccount) and then
// loginToken(token) on the same object, so it has to be called as a method, never detached.
const getAuthActions = () => findByProps("switchAccountToken", "loginToken");

export function getCurrentToken(): string | null {
    return findByStoreName("AuthenticationStore")?.getToken?.() ?? null;
}

export function getCurrentAccount(): SavedAccount | null {
    const token = getCurrentToken();
    const user = findByStoreName("UserStore")?.getCurrentUser?.();
    if (!token || !user) return null;
    return { id: user.id, username: user.username, avatar: user.avatar ?? null, token };
}

export function saveCurrentAccount(): SavedAccount | null {
    const account = getCurrentAccount();
    if (account) upsertAccount(account);
    return account;
}

export async function switchTo(account: SavedAccount) {
    const auth = getAuthActions();
    if (!auth) throw new Error("Discord's switchAccountToken was not found");
    await auth.switchAccountToken(account.token);
}

// The same local LOGOUT the real logout() ends with, without the request that revokes the token,
// so the account stays valid on Discord's side and can be switched back to.
export function openLoginForNewAccount() {
    FluxDispatcher.dispatch({ type: "LOGOUT" });
}

export function avatarUrl(account: SavedAccount): string | null {
    return account.avatar
        ? `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.png?size=64`
        : null;
}
