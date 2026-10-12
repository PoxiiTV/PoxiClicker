const { app, BrowserWindow, globalShortcut, ipcMain, nativeImage, shell } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

const ICON = path.join(__dirname, 'resources', 'icon.png')
// Instalado: el .ps1 va en resources/ (fuera del asar). En desarrollo, en la raíz
const HELPER = app.isPackaged ? path.join(process.resourcesPath, 'clicker.ps1') : path.join(__dirname, 'clicker.ps1')

let win = null
let helper = null
let hotkey = null
let posWaiter = null
let heldAcc = null // atajo que se libera mientras el modo "mantener" está armado
let updater = null

const RELEASES = 'https://github.com/PoxiiTV/PoxiClicker/releases/latest'
const PORTABLE = !!process.env.PORTABLE_EXECUTABLE_FILE

if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data)
}

function startHelper() {
  helper = spawn('powershell.exe', ['-NoProfile', '-NoLogo', '-ExecutionPolicy', 'Bypass', '-File', HELPER], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'ignore']
  })
  let buf = ''
  helper.stdout.on('data', (d) => {
    buf += d
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (line === 'ready') send('helper', { ready: true })
      else if (line === 'S') send('helper', { stopped: true })
      else if (line.startsWith('C ')) send('helper', { count: Number(line.slice(2)) })
      else if (line.startsWith('P ') && posWaiter) {
        const [x, y] = line.slice(2).split(' ').map(Number)
        posWaiter({ x, y })
        posWaiter = null
      }
    }
  })
  helper.on('exit', () => { helper = null })
  helper.stdin.on('error', () => {})
}

const cmd = (line) => helper && helper.stdin.writable && helper.stdin.write(line + '\n')

function setHotkey(acc) {
  if (hotkey) globalShortcut.unregister(hotkey)
  hotkey = null
  try {
    if (acc && globalShortcut.register(acc, () => send('toggle'))) {
      hotkey = acc
      return true
    }
  } catch {}
  return false
}

// Nunca confiamos en el renderer: todo se fuerza a número dentro de rango antes de llegar al ayudante
const clamp = (v, min, max, d) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Math.round(Number(v)))) : d)

// "Ctrl+Shift+F6" -> { vk, mods } para el ayudante (solo letras, números, F1-F24 y Espacio)
function accToKey(acc) {
  const parts = String(acc).split('+')
  const key = parts.pop()
  const mods = parts.reduce((m, p) => m | ({ Ctrl: 1, Alt: 2, Shift: 4 }[p] || 0), 0)
  let vk = null
  if (/^[A-Z0-9]$/.test(key)) vk = key.charCodeAt(0)
  else if (/^F([1-9]|1\d|2[0-4])$/.test(key)) vk = 0x6f + Number(key.slice(1))
  else if (key === 'Space') vk = 0x20
  return vk && { vk, mods }
}

ipcMain.handle('start', (_e, c) => {
  const cps = Math.min(500, Math.max(0.1, Number(c.cps) || 10))
  const common = [cps, clamp(c.button, 0, 2, 0), c.double ? 1 : 0, clamp(c.random, 0, 90, 0), clamp(c.limit, 0, 1e9, 0),
    c.fixed ? 1 : 0, clamp(c.x, -32768, 32767, 0), clamp(c.y, -32768, 32767, 0), clamp(c.delay, 0, 60000, 0)]
  if (c.mode !== 'hold') return cmd(['start', ...common].join(' ')), true
  // Mantener: el ayudante vigila la tecla; el atajo global se libera para no alternar a la vez
  const k = accToKey(hotkey || c.hotkey)
  if (!k) return false
  heldAcc = hotkey
  if (hotkey) globalShortcut.unregister(hotkey)
  cmd(['hold', k.vk, k.mods, ...common].join(' '))
  return true
})
ipcMain.handle('stop', () => {
  cmd('stop')
  if (heldAcc) {
    const acc = heldAcc
    heldAcc = null
    setHotkey(acc)
  }
})
ipcMain.handle('hotkey', (_e, acc) => setHotkey(String(acc)))
ipcMain.handle('pick-pos', () => new Promise((resolve) => {
  // 3 s para colocar el ratón; el ayudante responde en su mismo sistema de coordenadas (el de SetCursorPos)
  setTimeout(() => { posWaiter = resolve; cmd('pos') }, 3000)
}))
ipcMain.handle('version', () => app.getVersion())
ipcMain.handle('upd-accept', () => {
  if (PORTABLE) return shell.openExternal(RELEASES)
  if (updater) updater.downloadUpdate().catch(() => send('upd', { state: 'error' }))
})
ipcMain.handle('size', (_e, h) => {
  const height = clamp(h, 300, 700, 495)
  if (win.getContentSize()[1] !== height) win.setContentSize(600, height)
})
ipcMain.handle('pin', (_e, on) => win.setAlwaysOnTop(!!on))
ipcMain.on('win', (_e, a) => (a === 'min' ? win.minimize() : win.close()))

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 600, height: 495, useContentSize: true, resizable: false, maximizable: false,
    frame: false, show: false, backgroundColor: '#0f0e17',
    icon: nativeImage.createFromPath(ICON),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, sandbox: true }
  })
  win.setMenuBarVisibility(false)
  win.loadFile(path.join(__dirname, 'src', 'index.html'))
  win.once('ready-to-show', () => win.show())
  startHelper()
  win.webContents.once('did-finish-load', () => setTimeout(setupUpdater, 1500))
})

// Actualizaciones desde GitHub Releases: pregunta, descarga con barra, se instala en silencio y se reabre.
// El portable no se puede reemplazar a sí mismo: solo avisa y abre la descarga.
function setupUpdater() {
  if (!app.isPackaged) return
  updater = require('electron-updater').autoUpdater
  updater.autoDownload = false
  updater.autoInstallOnAppQuit = false
  updater.on('update-available', (i) => send('upd', { state: 'available', version: i.version, portable: PORTABLE }))
  updater.on('download-progress', (p) => send('upd', { state: 'downloading', percent: Math.round(p.percent) }))
  updater.on('update-downloaded', () => {
    send('upd', { state: 'installing' })
    setTimeout(() => updater.quitAndInstall(true, true), 900) // silencioso + reabrir al terminar
  })
  updater.on('error', () => send('upd', { state: 'error' }))
  updater.checkForUpdates().catch(() => {})
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (helper) {
    cmd('quit')
    setTimeout(() => helper && helper.kill(), 300)
  }
})
app.on('window-all-closed', () => app.quit())
