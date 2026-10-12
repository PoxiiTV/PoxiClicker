const $ = (id) => document.getElementById(id)
const root = document.documentElement
const KEY = 'poxiclicker.v1'
const DEFAULTS = {
  cps: 10, random: 0, button: 0, double: 0, fixed: 0, x: 0, y: 0, limit: 0, delay: 0, level: 0, mode: 0,
  profiles: [], profile: '', hotkey: 'F6', theme: 'dark', accent: 'blue', pin: false,
  lang: lang, tray: false, startup: false, sound: true
}
const SIMPLE_H = 372 // alto de la ventana en modo Simple (el Avanzado mide 495)
const PROFILE_KEYS = ['cps', 'random', 'button', 'double', 'fixed', 'x', 'y', 'limit', 'delay', 'mode']

let s = { ...DEFAULTS }
try { s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch {}
if (!Array.isArray(s.profiles)) s.profiles = []
if (!LANGS.includes(s.lang)) s.lang = DEFAULTS.lang
lang = s.lang
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

let running = false
let ready = false
let real = 0 // CPS reales medidos por el ayudante

// El modo Mantener solo existe en la interfaz avanzada
const holdMode = () => Number(s.level) === 1 && Number(s.mode) === 1

let toastTimer
function toast(text, ms = 3500) {
  const el = $('toast')
  el.textContent = text
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), ms)
}

// Pitidos cortos al activar y parar (sin archivos de audio): suben al empezar, bajan al parar
let audio
function beep(on) {
  if (!s.sound) return
  try {
    audio = audio || new AudioContext()
    const t0 = audio.currentTime
    ;(on ? [660, 880] : [880, 520]).forEach((freq, i) => {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.09)
      gain.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.09 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.09 + 0.085)
      osc.connect(gain).connect(audio.destination)
      osc.start(t0 + i * 0.09)
      osc.stop(t0 + i * 0.09 + 0.09)
    })
  } catch {}
}

function renderInterval() {
  const ms = (1000 / s.cps).toFixed(s.cps >= 10 ? 0 : 1)
  $('interval').textContent = t('interval', { ms }) + (running && real > 0 ? ` · ${t('real')} ${real} CPS` : '')
}

// La bandeja y el inicio con Windows los gestiona el proceso principal: solo se avisa si algo cambió
let lastPrefs = ''
function syncPrefs() {
  const p = {
    tray: !!s.tray, startup: !!s.startup, running,
    labels: { show: t('tray.show'), start: t('tray.start'), stop: t('tray.stop'), quit: t('tray.quit'), active: t('tray.active') }
  }
  const json = JSON.stringify(p)
  if (json === lastPrefs) return
  lastPrefs = json
  window.poxi.prefs(p)
}

function render() {
  root.dataset.theme = s.theme
  root.dataset.accent = s.accent
  root.dataset.level = s.level
  $('cps').value = s.cps
  $('cpsRange').value = Math.min(100, s.cps)
  renderInterval()
  $('random').value = s.random
  $('randomOut').textContent = s.random + '%'
  $('x').value = s.x
  $('y').value = s.y
  $('limit').value = s.limit
  $('delay').value = s.delay
  $('toggleKey').textContent = s.hotkey
  $('posRow').classList.toggle('off', !s.fixed)
  $('pin').classList.toggle('on', s.pin)
  for (const id of ['button', 'double', 'fixed'])
    $(id).querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === Number(s[id])))
  $('accents').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.a === s.accent))
  $('level').querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === Number(s.level)))
  $('themeSel').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === s.theme))
  $('langSel').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === s.lang))
  $('mode').querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === Number(s.mode)))
  $('optTray').checked = !!s.tray
  $('optStartup').checked = !!s.startup
  $('optSound').checked = !!s.sound
  const sel = $('profile')
  sel.replaceChildren(new Option(t('profile.none'), ''), ...s.profiles.map((p) => new Option(p.name, p.name)))
  sel.value = s.profiles.some((p) => p.name === s.profile) ? s.profile : ''
  $('delProfile').disabled = !sel.value
  $('toggle').classList.toggle('running', running)
  const hold = holdMode()
  $('toggleLabel').textContent = !ready ? t('btn.starting') : running ? t(hold ? 'btn.disarm' : 'btn.stop') : t(hold ? 'btn.arm' : 'btn.start')
  $('toggle').disabled = !ready
  window.poxi.size(Number(s.level) === 1 ? 495 : SIMPLE_H)
  syncPrefs()
}

function set(patch) {
  s = { ...s, ...patch }
  save()
  render()
}

const num = (el, min, max) => {
  const v = parseFloat(el.value)
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min
}

async function start() {
  if (!ready) return
  running = true
  real = 0
  $('count').textContent = '0'
  render()
  // En Simple, lo que solo existe en Avanzado (límite y retardo) no se aplica aunque quedara guardado
  const adv = Number(s.level) === 1
  const ok = await window.poxi.start({ ...s, limit: adv ? s.limit : 0, delay: adv ? Math.round(s.delay * 1000) : 0, mode: holdMode() ? 'hold' : 'toggle' })
  if (!ok) {
    running = false
    render()
    toast(t('toast.holdKey'), 5000)
    return
  }
  beep(true)
}

function stop() {
  const was = running
  running = false
  real = 0
  window.poxi.stop()
  render()
  if (was) beep(false)
}

const toggle = () => (running ? stop() : start())

// Entradas
$('cpsRange').oninput = (e) => set({ cps: Number(e.target.value) })
$('cps').onchange = (e) => set({ cps: num(e.target, 0.1, 500) })
$('random').oninput = (e) => set({ random: Number(e.target.value) })
$('x').onchange = (e) => set({ x: Math.round(num(e.target, -32768, 32767)) })
$('y').onchange = (e) => set({ y: Math.round(num(e.target, -32768, 32767)) })
$('limit').onchange = (e) => set({ limit: Math.round(num(e.target, 0, 1e9)) })
$('delay').onchange = (e) => set({ delay: num(e.target, 0, 60) })
for (const id of ['button', 'double', 'fixed'])
  $(id).onclick = (e) => e.target.dataset.v !== undefined && set({ [id]: Number(e.target.dataset.v) })
$('level').onclick = (e) => {
  if (e.target.dataset.v === undefined) return
  if (running) stop()
  set({ level: Number(e.target.dataset.v) })
}

// Panel de ajustes (modo, tema, color, idioma y opciones)
const menu = (open) => {
  $('menu').hidden = !open
  $('cfg').classList.toggle('on', open)
  $('cfg').setAttribute('aria-expanded', open)
}
$('cfg').onclick = (e) => { e.stopPropagation(); menu($('menu').hidden) }
$('menu').onclick = (e) => e.stopPropagation()
$('themeSel').onclick = (e) => e.target.dataset.v && set({ theme: e.target.dataset.v })
$('langSel').onclick = (e) => {
  if (!LANGS.includes(e.target.dataset.v)) return
  lang = e.target.dataset.v
  applyI18n()
  set({ lang })
}
$('optTray').onchange = (e) => set({ tray: e.target.checked })
$('optStartup').onchange = (e) => set({ startup: e.target.checked })
$('optSound').onchange = (e) => { set({ sound: e.target.checked }); beep(true) }
document.addEventListener('click', () => menu(false))
document.addEventListener('keydown', (e) => e.key === 'Escape' && menu(false))
$('mode').onclick = (e) => {
  if (e.target.dataset.v === undefined) return
  if (running) stop()
  set({ mode: Number(e.target.dataset.v) })
}
$('accents').onclick = (e) => e.target.dataset.a && set({ accent: e.target.dataset.a })
$('theme').onclick = () => set({ theme: s.theme === 'dark' ? 'light' : 'dark' })
$('pin').onclick = () => { set({ pin: !s.pin }); window.poxi.pin(s.pin) }
$('min').onclick = () => window.poxi.win('min')
$('close').onclick = () => window.poxi.win('close')
$('toggle').onclick = toggle

// Perfiles: guardan los ajustes de clic (no el tema ni el color)
$('profile').onchange = (e) => {
  const p = s.profiles.find((x) => x.name === e.target.value)
  if (running) stop()
  set(p ? { ...p.data, profile: p.name } : { profile: '' })
}
$('saveProfile').onclick = () => {
  const name = $('profileName').value.trim().slice(0, 24) || s.profile
  if (!name) return $('profileName').focus()
  const data = Object.fromEntries(PROFILE_KEYS.map((k) => [k, s[k]]))
  set({ profiles: [...s.profiles.filter((p) => p.name !== name), { name, data }], profile: name })
  $('profileName').value = ''
  toast(t('profile.saved', { n: name }), 2000)
}
$('profileName').onkeydown = (e) => e.key === 'Enter' && $('saveProfile').click()
$('delProfile').onclick = () => {
  if (!s.profile) return
  set({ profiles: s.profiles.filter((p) => p.name !== s.profile), profile: '' })
}

$('pick').onclick = async () => {
  const b = $('pick')
  b.disabled = true
  for (let i = 3; i > 0; i--) { b.textContent = t('pos.mouse', { n: i }); await new Promise((r) => setTimeout(r, 1000)) }
  b.textContent = t('pos.capturing')
  const p = await window.poxi.pickPos()
  b.textContent = t('pos.capture')
  b.disabled = false
  set({ x: p.x, y: p.y })
}

// Atajo global: pulsa una tecla (con o sin Ctrl/Alt/Shift) mientras el botón escucha
$('hotkey').onclick = () => {
  const b = $('hotkey')
  b.classList.add('listening')
  $('toggleKey').textContent = '…'
  const onKey = async (e) => {
    e.preventDefault()
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return
    window.removeEventListener('keydown', onKey, true)
    b.classList.remove('listening')
    if (running) stop()
    let k = e.key.length === 1 ? e.key.toUpperCase() : e.key
    if (k === ' ') k = 'Space'
    if (k === 'Escape') return render()
    const acc = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', k].filter(Boolean).join('+')
    if (await window.poxi.hotkey(acc)) set({ hotkey: acc })
    else render()
  }
  window.addEventListener('keydown', onKey, true)
}

window.poxi.onToggle(toggle)
window.poxi.onHelper((d) => {
  if (d.ready) {
    ready = true
    render()
  }
  if (d.count !== undefined) $('count').textContent = d.count.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')
  if (d.real !== undefined) {
    real = d.real
    renderInterval()
  }
  if (d.stopped && running) {
    running = false
    real = 0
    window.poxi.stop() // devuelve el atajo global si estaba en modo Mantener
    render()
    beep(false)
  }
})

applyI18n()
render()
window.poxi.pin(s.pin)
window.poxi.hotkey(s.hotkey).then((ok) => {
  if (!ok) { s.hotkey = 'F6'; window.poxi.hotkey('F6'); render() }
})

// Actualizaciones: pregunta, descarga con barra y se reinstala solo
let updPortable = false
const upd = (title, text, { bar = false, actions = false, yes = t('upd.yes') } = {}) => {
  $('upd').hidden = false
  $('updTitle').textContent = title
  $('updText').textContent = text
  $('updBar').hidden = !bar
  $('updActions').hidden = !actions
  $('updYes').textContent = yes
}
$('updLater').onclick = () => { $('upd').hidden = true }
$('updYes').onclick = () => {
  window.poxi.updAccept()
  if (!updPortable) upd(t('upd.downloading'), t('upd.dontclose'), { bar: true })
  else $('upd').hidden = true
}
window.poxi.onUpdate((d) => {
  if (d.state === 'available') {
    updPortable = d.portable
    upd(t('upd.available', { v: d.version }), t(d.portable ? 'upd.portable' : 'upd.ask'),
      { actions: true, yes: t(d.portable ? 'upd.open' : 'upd.yes') })
  } else if (d.state === 'downloading') {
    upd(t('upd.downloading'), `${d.percent}%`, { bar: true })
    $('updFill').style.width = d.percent + '%'
  } else if (d.state === 'installing') {
    upd(t('upd.installing'), t('upd.restarting'), { bar: true })
    $('updFill').style.width = '100%'
  } else if (d.state === 'error' && !$('updBar').hidden) {
    $('upd').hidden = true
    toast(t('upd.error'), 5000)
  }
})

// Tras actualizarse y reabrirse, avisa de la versión nueva
window.poxi.version().then((v) => {
  let last = null
  try { last = localStorage.getItem('poxiclicker.ver'); localStorage.setItem('poxiclicker.ver', v) } catch {}
  if (last && last !== v) toast(t('upd.done', { v }), 5000)
})
