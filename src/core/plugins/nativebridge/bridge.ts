import { processColor } from "react-native";

// The native BridgeModule replies with { result } on success or { error } on failure.
// `invoke` sends the raw payload and resolves to that reply object.
export type NativeInvoke = (
    payload: { Placeholder: { method: string; args: unknown[] } },
) => Promise<any>;

export interface NativeApi {
    /** Generic escape hatch: call any registered native method by name. */
    call(method: string, ...args: unknown[]): Promise<any>;
    /** Names of every method the native side currently exposes. */
    modules(): Promise<string[]>;
    bubbles: {
        setEnabled(enabled: boolean): Promise<void>;
        configure(opts: {
            avatarRadius?: number;
            bubbleRadius?: number;
            bubbleColor?: string;
        }): Promise<void>;
    };
    fs: {
        read(path: string): Promise<string>;
        write(path: string, data: string): Promise<void>;
        exists(path: string): Promise<boolean>;
    };
    app: {
        reload(): Promise<void>;
    };
}

export function makeNative(invoke: NativeInvoke): NativeApi {
    const call = async (method: string, ...args: unknown[]) => {
        const reply = await invoke({ Placeholder: { method, args } });
        if (reply && typeof reply === "object" && "error" in reply) {
            throw new Error(String(reply.error));
        }
        return reply?.result;
    };

    return {
        call,
        modules: () => call("modules"),
        bubbles: {
            setEnabled: enabled => call(enabled ? "bubbles.hook" : "bubbles.unhook"),
            configure: ({ avatarRadius, bubbleRadius, bubbleColor }) =>
                call(
                    "bubbles.configure",
                    avatarRadius,
                    bubbleRadius,
                    bubbleColor != null ? Number(processColor(bubbleColor)) : null,
                ),
        },
        fs: {
            read: path => call("fs.read", path),
            write: (path, data) => call("fs.write", path, data),
            exists: path => call("fs.exists", path),
        },
        app: {
            reload: () => call("app.reload"),
        },
    };
}
