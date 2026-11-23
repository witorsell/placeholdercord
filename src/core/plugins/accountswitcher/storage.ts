import { awaitStorage, createStorage } from "@lib/api/storage";

export interface SavedAccount {
    id: string;
    username: string;
    avatar: string | null;
    token: string;
}

interface AccountSwitcherData {
    accounts: SavedAccount[];
    autoSave: boolean;
}

export const accountStore = createStorage<AccountSwitcherData>(
    "plugins/storage/bunny.accountswitcher.json",
    { dflt: { accounts: [], autoSave: true } },
);

export const accountStoreReady = () => awaitStorage(accountStore);

export function listAccounts(): SavedAccount[] {
    return (accountStore.accounts ?? []).map(a => ({ ...a }));
}

export function upsertAccount(account: SavedAccount) {
    const accounts = listAccounts();
    const idx = accounts.findIndex(a => a.id === account.id);
    if (idx >= 0) accounts[idx] = account;
    else accounts.push(account);
    accountStore.accounts = accounts;
}

export function removeAccount(id: string) {
    accountStore.accounts = listAccounts().filter(a => a.id !== id);
}

export function isAutoSaveEnabled(): boolean {
    return accountStore.autoSave !== false;
}

export function setAutoSave(value: boolean) {
    accountStore.autoSave = value;
}
