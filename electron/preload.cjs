const { contextBridge, ipcRenderer } = require('electron');

// A hand-rolled bridge rather than electron-log/preload: that helper relies on require()
// resolving an arbitrary node_modules package from inside the preload script, which fails
// under Electron's default sandboxed preload (sandbox: true — see main.cjs, kept on
// deliberately). electron/ipcRenderer are the only things a sandboxed preload can
// require(), so the bridge is built from those directly; main.cjs's ipcMain listener is
// what actually writes to electron-log's file.
contextBridge.exposeInMainWorld('torahElectron', {
  isElectron: true,
  log(level, category, message, meta) {
    ipcRenderer.send('torah:log', { level, category, message, meta });
  },
});
