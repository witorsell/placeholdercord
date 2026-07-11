# PlaceholderCord

A Discord Android client mod. This is a fork of [ShiggyCord](https://github.com/kmmiio99o/ShiggyCord), which is built on the Kettu / Bunny / Vendetta family of mobile mods.

### Added on top of the base

- **Native rounded chat bubbles.** Messages get a rounded bubble background and rounded avatars, drawn natively (this can't be faked from JS, since Discord renders chat in native code). The drawing lives in [PlaceholderXposed](https://github.com/witorsell/PlaceholderXposed)'s `BubbleModule`, ported from [rainXposed](https://github.com/ra1ncord/rainXposed). Bubbles are on by default, with bridge hooks to toggle and restyle them.

- **Native Bridge.** A built-in core plugin (`bunny.nativebridge`) that exposes `window.placeholder.native` to JavaScript plugins, allowing them to invoke native Android methods via Xposed. This powers Native Bubbles and Virtual Camera.

- **Virtual Camera.** A native capturer override module inside [PlaceholderXposed](https://github.com/witorsell/PlaceholderXposed) that lets you spoof your video call stream with any local image/video/gif via the Native Bridge.

Everything else is inherited from ShiggyCord/Kettu. Credit to those projects, and to rain for the bubble implementation.

## Installing

### Android

- Rooted: [Placeholder Xposed](https://github.com/witorsell/PlaceholderXposed)

- Non-Rooted: [Placeholder Manager](https://github.com/witorsell/PlaceholderManager)

### Android/iOS
- **Injecting bundle:**
  ```url
  https://github.com/witorsell/PlaceholderCord/releases/latest/download/placeholdercord.js
  ```

## Building
1. Install a PlaceholderCord loader with loader config support (any mentioned in the [Installing](#installing) section).
1. Go to Settings > General and enable Developer Settings.
1. Clone the repo:
    ```
    git clone https://github.com/witorsell/Placeholdercord.git
    ```
1. Install dependencies:
    ```
    bun i
    ```
1. Build PlaceholderCord's code:
    ```
    bun run build
    ```
1. In the newly created `dist` directory, run a HTTP server. I recommend [http-server](https://www.npmjs.com/package/http-server).
1. Go to Settings > Developer enabled earlier. Enable `Load from custom url` and input the IP address and port of the server (e.g. `http://192.168.1.236:4040/placeholdercord.js`) in the new input box labelled `PlaceholderCord URL`.
1. Restart Discord. Upon reload, you should notice that your device will download PlaceholderCord's bundled code from your server, rather than GitHub.
1. Make your changes, rebuild, reload, go wild!

Alternatively, you can directly *serve* the bundled code by running `bun run serve`. `placeholdercord.js` will be served on your local address under the port 4040. You will then insert `http://<local ip address>:4040/placeholdercord.js` as a custom url and reload. Whenever you restart your mobile client, the script will rebuild the bundle as your client fetches it.
