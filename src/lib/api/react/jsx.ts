import { after } from "@lib/api/patcher";
import { findByPropsLazy } from "@metro";

type Callback = (Component: any, ret: JSX.Element) => JSX.Element;
const callbacks = new Map<string, Callback[]>();

const jsxRuntime = findByPropsLazy("jsx", "jsxs");

export function onJsxCreate(Component: string, callback: Callback) {
    if (!callbacks.has(Component)) callbacks.set(Component, []);
    callbacks.get(Component)!.push(callback);
}

export function deleteJsxCreate(Component: string, callback: Callback) {
    if (!callbacks.has(Component)) return;
    const cbs = callbacks.get(Component)!;
    cbs.splice(cbs.indexOf(callback), 1);
    if (cbs.length === 0) callbacks.delete(Component);
}

/**
 * @internal
 */
export function patchJsx() {
    const callback = ([Component]: unknown[], ret: JSX.Element) => {
        // Band-aid fix for iOS invalid element type crashes
        if (typeof ret.type === 'undefined') {
            ret.type = 'RCTView'
            return ret
        }

        // Function components are matched by name. React.memo components are objects, so match
        // those by the displayName of the function they wrap (Discord 352 exports many components
        // as memo(fn) with no forwardRef, so there is no .render to patch).
        const name =
            typeof Component === "function"
                ? Component.name
                : Component && typeof Component === "object"
                  ? Component.type?.displayName ?? Component.displayName
                  : undefined;

        if (name && callbacks.has(name)) {
            const cbs = callbacks.get(name)!;
            for (const cb of cbs) {
                const _ret = cb(Component, ret);
                if (_ret !== undefined) ret = _ret;
            }
            return ret;
        }
    };

    const patches = [
        after("jsx", jsxRuntime, callback),
        after("jsxs", jsxRuntime, callback)
    ];

    return () => patches.forEach(unpatch => unpatch());
}
