# PlaceholderCord [![Discord](https://img.shields.io/discord/1427396621905432699?style=social&logo=discord&label=PlaceholderCord)](https://discord.placeholdercord.dev)

Bundle based on Kettu, made just for fun

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
