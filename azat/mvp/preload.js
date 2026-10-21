const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('azat', {
  status: () => ipcRenderer.invoke('auth:status'),
  login: (id) => ipcRenderer.invoke('auth:login', id),
  chat: (messages) => ipcRenderer.invoke('chat:send', messages)
});