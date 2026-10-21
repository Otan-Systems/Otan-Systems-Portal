const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch (e) {
  console.error('.env not found');
}

const TTL_MS = (Number(process.env.MEMBERSHIP_TTL_HOURS) || 96) * 3600 * 1000;
const authFile = () => path.join(app.getPath('userData'), 'membership.json');
const readAuth = () => { try { return JSON.parse(fs.readFileSync(authFile(), 'utf8')); } catch { return null; } };
const norm = (s) => String(s || '').trim().toUpperCase();

ipcMain.handle('auth:status', () => {
  const a = readAuth();
  const ok = !!a && a.id === norm(process.env.MEMBERSHIP_ID) && a.expiresAt > Date.now();
  return { ok, expiresAt: ok ? a.expiresAt : null };
});

ipcMain.handle('auth:login', (_e, id) => {
  const want = norm(process.env.MEMBERSHIP_ID);
  if (!want || norm(id) !== want) return { ok: false, error: 'invalid' };
  let a = readAuth();
  if (!a || a.id !== want) {
    a = { id: want, expiresAt: Date.now() + TTL_MS };
    fs.writeFileSync(authFile(), JSON.stringify(a));
  }
  if (a.expiresAt <= Date.now()) return { ok: false, error: 'expired' };
  return { ok: true, expiresAt: a.expiresAt };
});

ipcMain.handle('chat:send', async (_e, messages) => {
  const a = readAuth();
  if (!a || a.expiresAt <= Date.now()) return { ok: false, error: 'auth' };
  try {
    const r = await fetch(process.env.AZAT_OS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SK_AZAT_OS
      },
      body: JSON.stringify({ model: process.env.OTANSYSTEMS_AZAT_A1, messages })
    });
    const text = await r.text();
    if (!r.ok) return { ok: false, error: 'HTTP ' + r.status + ': ' + text };
    const data = JSON.parse(text);
    return { ok: true, content: data.choices?.[0]?.message?.content ?? '' };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 820,
    height: 720,
    minWidth: 520,
    minHeight: 480,
    title: 'Azat AI',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^(https:|mailto:)/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});