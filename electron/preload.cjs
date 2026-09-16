const { contextBridge } = require('electron');

// Wires the IPC bridge electron-log/renderer expects, so calls made from the renderer
// (src/utils/logger-client/electron.ts) reach the main process and land in the log file
// electron-log/main sets up via log.initialize() in main.cjs.
require('electron-log/preload');

// Lets src/utils/logger-client/index.ts tell "running inside our Electron app's
// renderer" apart from plain web / Capacitor at runtime — nothing else sets this.
contextBridge.exposeInMainWorld('torahElectron', true);
