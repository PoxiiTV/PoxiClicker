const { app, BrowserWindow, globalShortcut, ipcMain, nativeImage } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

const ICON = path.join(__dirname, 'resources', 'icon.png')
// Instalado: el .ps1 va en resources/ (fuera del asar). En desarrollo, en la raíz
const HELPER = app.isPackaged ? path.join(process.resourcesPath, 'clicker.ps1') : path.join(__dirname, 'clicker.ps1')

let win = null
let helper = null
let hotkey = null
let posWaiter = null

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

ipcMain.handle('start', (_e, c) => {
  const cps = Math.min(500, Math.max(0.1, Number(c.cps) || 10))
  cmd(['start', cps, clamp(c.button, 0, 2, 0), c.double ? 1 : 0, clamp(c.random, 0, 90, 0), clamp(c.limit, 0, 1e9, 0),
    c.fixed ? 1 : 0, clamp(c.x, -32768, 32767, 0), clamp(c.y, -32768, 32767, 0), clamp(c.delay, 0, 60000, 0)].join(' '))
})
ipcMain.handle('stop', () => cmd('stop'))
ipcMain.handle('hotkey', (_e, acc) => setHotkey(String(acc)))
ipcMain.handle('pick-pos', () => new Promise((resolve) => {
  // 3 s para colocar el ratón; el ayudante responde en su mismo sistema de coordenadas (el de SetCursorPos)
  setTimeout(() => { posWaiter = resolve; cmd('pos') }, 3000)
}))
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
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (helper) {
    cmd('quit')
    setTimeout(() => helper && helper.kill(), 300)
  }
})
app.on('window-all-closed', () => app.quit())
