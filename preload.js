const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('poxi', {
  start: (c) => ipcRenderer.invoke('start', c),
  stop: () => ipcRenderer.invoke('stop'),
  hotkey: (a) => ipcRenderer.invoke('hotkey', a),
  pickPos: () => ipcRenderer.invoke('pick-pos'),
  prefs: (p) => ipcRenderer.invoke('prefs', p),
  version: () => ipcRenderer.invoke('version'),
  updAccept: () => ipcRenderer.invoke('upd-accept'),
  size: (h) => ipcRenderer.invoke('size', h),
  pin: (on) => ipcRenderer.invoke('pin', on),
  win: (a) => ipcRenderer.send('win', a),
  onToggle: (f) => ipcRenderer.on('toggle', () => f()),
  onUpdate: (f) => ipcRenderer.on('upd', (_e, d) => f(d)),
  onHelper: (f) => ipcRenderer.on('helper', (_e, d) => f(d))
})
