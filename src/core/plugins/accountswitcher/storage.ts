import { createStorage as createStorageNew } from "@lib/api/storage";

export interface SavedAccount {
    token: string;
    username: string;
    discriminator: string;
    avatarUrl: string | null;
    id: string;
}

export interface AccountSwitcherData {
    accounts: SavedAccount[];
}

export const accountStore = createStorageNew<AccountSwitcherData>(
    "placeholdercord/accountswitcher",
    { dflt: { accounts: [] } },
);

export function getSavedAccounts(): SavedAccount[] {
    try {
        return (accountStore as any).accounts ?? [];
    } catch {
        return [];
    }
}

export function saveAccount(account: SavedAccount) {
    const existing = getSavedAccounts();
    const idx = existing.findIndex(a => a.id === account.id);
    if (idx >= 0) {
        existing[idx] = account;
    } else {
        existing.push(account);
    }
    (accountStore as any).accounts = existing;
}

export function removeAccount(id: string) {
    const existing = getSavedAccounts();
    (accountStore as any).accounts = existing.filter(a => a.id !== id);
}
