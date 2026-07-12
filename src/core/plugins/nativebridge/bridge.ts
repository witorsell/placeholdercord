import { processColor } from "react-native";

// The native BridgeModule replies with { result } on success or { error } on failure.
// `invoke` sends the raw payload and resolves to that reply object.
export type NativeInvoke = (
    payload: { Placeholder: { method: string; args: unknown[] } },
) => Promise<any>;

/** What the native bubble methods return: the state actually applied. */
export interface BubbleState {
    enabled: boolean;
    avatarRadius: number;
    bubbleRadius: number;
    bubbleColor: number;
}

export interface DeviceSpoofOptions {
    device?: string;
    model?: string;
    brand?: string;
    product?: string;
    manufacturer?: string;
    socName?: string;
    ramSize?: string;
    maxCpuFreq?: string;
    /** The persistent per-install UUID Discord's backend actually uses for Android device identity. */
    deviceVendorId?: string;
}

/** Currently spoofed values; a field is null when not overridden. */
export type DeviceSpoofState = Required<{ [K in keyof DeviceSpoofOptions]: string | null }>;

export interface NativeApi {
    /** Generic escape hatch: call any registered native method by name. */
    call(method: string, ...args: unknown[]): Promise<any>;
    /** Names of every method the native side currently exposes. */
    modules(): Promise<string[]>;
    bubbles: {
        /** Resolves to the enabled state that was actually applied. */
        setEnabled(enabled: boolean): Promise<boolean>;
        configure(opts: {
            avatarRadius?: number;
            bubbleRadius?: number;
            bubbleColor?: string;
        }): Promise<BubbleState>;
    };
    fs: {
        read(path: string): Promise<string>;
        write(path: string, data: string): Promise<void>;
        exists(path: string): Promise<boolean>;
    };
    app: {
        reload(): Promise<void>;
    };
    camera: {
        /** Resolves to the path that was actually applied, or null if disabled. */
        setMedia(path: string | null): Promise<string | null>;
    };
    device: {
        /** Resolves to the full spoof state after applying. Omitted fields are cleared. */
        spoof(opts: DeviceSpoofOptions): Promise<DeviceSpoofState>;
        resetSpoof(): Promise<DeviceSpoofState>;
        getSpoofState(): Promise<DeviceSpoofState>;
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
        camera: {
            setMedia: path => call("camera.setMedia", path),
        },
        device: {
            spoof: opts => call("device.spoof", opts),
            resetSpoof: () => call("device.resetSpoof"),
            getSpoofState: () => call("device.getSpoofState"),
        },
    };
}
