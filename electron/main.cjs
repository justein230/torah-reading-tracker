const { app, BrowserWindow, ipcMain } = require('electron');
const net  = require('node:net');
const path = require('node:path');
const fs   = require('node:fs');
const log  = require('electron-log/main');

// Captures both this (main) process's and the renderer's logging into a real, rotated
// file at the OS-conventional log location. Separate from server.ts's own pino-based
// request log — this one covers the desktop app shell and frontend, not API/mutation
// traffic (which the embedded server logs itself either way).
log.initialize();

const LOG_LEVELS = new Set(['error', 'warn', 'info', 'debug']);

// Renderer-side logging (src/utils/logger-client/electron.ts) reaches this via
// preload.cjs's contextBridge — see that file for why this is a hand-rolled bridge
// rather than electron-log/preload + electron-log/renderer.
ipcMain.on('torah:log', (_event, { level, category, message, meta } = {}) => {
  const fn = LOG_LEVELS.has(level) ? level : 'info';
  log[fn](`[${category}] ${message}`, meta ?? '');
});

let mainWindow = null;
let serverPort = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function seedDatabase() {
  const userDb = path.join(app.getPath('userData'), 'torah.db');
  const seedDb = path.join(__dirname, '..', 'seed.db');
  if (!fs.existsSync(userDb) && fs.existsSync(seedDb)) {
    fs.copyFileSync(seedDb, userDb);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const url = process.env.ELECTRON_DEV
    ? 'http://localhost:8000'
    : `http://127.0.0.1:${serverPort}`;

  mainWindow.loadURL(url);
  mainWindow.on('closed', () => { mainWindow = null; });
}

async function start() {
  seedDatabase();

  if (!process.env.ELECTRON_DEV) {
    serverPort = await getFreePort();
    process.env.TORAH_DB_PATH = path.join(app.getPath('userData'), 'torah.db');
    process.env.PORT = String(serverPort);

    const { app: expressApp } = await import('../dist-server/server.js');
    await new Promise(resolve => expressApp.listen(serverPort, '127.0.0.1', resolve));
  }

  createWindow();
}

app.whenReady().then(start);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
