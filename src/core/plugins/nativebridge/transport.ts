import { getNativeModule } from "@lib/api/native/modules";

// The native BridgeModule intercepts calls to FileReaderModule.readAsDataURL whose argument
// carries the Placeholder key, runs the method, and resolves this promise with the reply.
interface FileReaderModuleShape {
    readAsDataURL(payload: unknown): Promise<any>;
}

const FileReaderModule = getNativeModule<FileReaderModuleShape>("FileReaderModule");

export async function sendToNative(
    payload: { Placeholder: { method: string; args: unknown[] } },
): Promise<any> {
    if (!FileReaderModule?.readAsDataURL) {
        throw new Error(
            "[NativeBridge] FileReaderModule.readAsDataURL is unavailable; the native bridge is not present in this build",
        );
    }
    return FileReaderModule.readAsDataURL(payload);
}
