import { ReactNative } from "@metro/common";

import { avatarUrl } from "./auth";
import { SavedAccount } from "./storage";

const { Image, View } = ReactNative;

export default function AccountAvatar({ account }: { account: SavedAccount; }) {
    const uri = avatarUrl(account);
    return uri
        ? <Image source={{ uri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
        : <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#4e5058" }} />;
}
