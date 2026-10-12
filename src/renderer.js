const $ = (id) => document.getElementById(id)
const root = document.documentElement
const KEY = 'poxiclicker.v1'
const DEFAULTS = { cps: 10, random: 0, button: 0, double: 0, fixed: 0, x: 0, y: 0, limit: 0, delay: 0, level: 0, mode: 0, profiles: [], profile: '', hotkey: 'F6', theme: 'dark', accent: 'blue', pin: false }
const SIMPLE_H = 372 // alto de la ventana en modo Simple (el Avanzado mide 495)
const PROFILE_KEYS = ['cps', 'random', 'button', 'double', 'fixed', 'x', 'y', 'limit', 'delay', 'mode']

let s = { ...DEFAULTS }
try { s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch {}
if (!Array.isArray(s.profiles)) s.profiles = []
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

let running = false
let ready = false

// El modo Mantener solo existe en la interfaz avanzada
const holdMode = () => Number(s.level) === 1 && Number(s.mode) === 1

let toastTimer
function toast(text, ms = 3500) {
  const t = $('toast')
  t.textContent = text
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), ms)
}

function render() {
  root.dataset.theme = s.theme
  root.dataset.accent = s.accent
  root.dataset.level = s.level
  $('cps').value = s.cps
  $('cpsRange').value = Math.min(100, s.cps)
  $('interval').textContent = `Un clic cada ${(1000 / s.cps).toFixed(s.cps >= 10 ? 0 : 1)} ms`
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
  $('mode').querySelectorAll('button').forEach((b) => b.classList.toggle('on', Number(b.dataset.v) === Number(s.mode)))
  const sel = $('profile')
  sel.replaceChildren(new Option('Sin perfil', ''), ...s.profiles.map((p) => new Option(p.name, p.name)))
  sel.value = s.profiles.some((p) => p.name === s.profile) ? s.profile : ''
  $('delProfile').disabled = !sel.value
  $('toggle').classList.toggle('running', running)
  const hold = holdMode()
  $('toggleLabel').textContent = !ready ? 'Iniciando…' : running ? (hold ? 'Desactivar' : 'Parar') : (hold ? 'Activar' : 'Iniciar')
  $('toggle').disabled = !ready
  window.poxi.size(Number(s.level) === 1 ? 495 : SIMPLE_H)
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
  $('count').textContent = '0'
  render()
  // En Simple, lo que solo existe en Avanzado (límite y retardo) no se aplica aunque quedara guardado
  const adv = Number(s.level) === 1
  const ok = await window.poxi.start({ ...s, limit: adv ? s.limit : 0, delay: adv ? Math.round(s.delay * 1000) : 0, mode: holdMode() ? 'hold' : 'toggle' })
  if (!ok) {
    running = false
    render()
    toast('En modo Mantener el atajo debe ser una letra, un número, F1–F24 o Espacio', 5000)
  }
}

function stop() {
  running = false
  window.poxi.stop()
  render()
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
// Panel de ajustes (modo, tema y color)
const menu = (open) => {
  $('menu').hidden = !open
  $('cfg').classList.toggle('on', open)
  $('cfg').setAttribute('aria-expanded', open)
}
$('cfg').onclick = (e) => { e.stopPropagation(); menu($('menu').hidden) }
$('menu').onclick = (e) => e.stopPropagation()
$('themeSel').onclick = (e) => e.target.dataset.v && set({ theme: e.target.dataset.v })
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
  toast(`Perfil «${name}» guardado`, 2000)
}
$('profileName').onkeydown = (e) => e.key === 'Enter' && $('saveProfile').click()
$('delProfile').onclick = () => {
  if (!s.profile) return
  set({ profiles: s.profiles.filter((p) => p.name !== s.profile), profile: '' })
}

$('pick').onclick = async () => {
  const b = $('pick')
  b.disabled = true
  for (let i = 3; i > 0; i--) { b.textContent = `Ratón… ${i}`; await new Promise((r) => setTimeout(r, 1000)) }
  b.textContent = 'Capturando…'
  const p = await window.poxi.pickPos()
  b.textContent = 'Capturar'
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
  if (d.count !== undefined) {
    $('count').textContent = d.count.toLocaleString('es-ES')
  }
  if (d.stopped && running) {
    running = false
    window.poxi.stop() // devuelve el atajo global si estaba en modo Mantener
    render()
  }
})

render()
window.poxi.pin(s.pin)
window.poxi.hotkey(s.hotkey).then((ok) => {
  if (!ok) { s.hotkey = 'F6'; window.poxi.hotkey('F6'); render() }
})

// Actualizaciones: pregunta, descarga con barra y se reinstala solo
const upd = (title, text, { bar = false, actions = false, yes = 'Actualizar' } = {}) => {
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
  if (!updPortable) upd('Descargando actualización…', 'No cierres la app, se reiniciará sola.', { bar: true })
  else $('upd').hidden = true
}
let updPortable = false
window.poxi.onUpdate((d) => {
  if (d.state === 'available') {
    updPortable = d.portable
    upd(`Versión ${d.version} disponible`, d.portable ? 'Es la versión portable: se abrirá la página de descarga.' : '¿Quieres actualizar ahora?',
      { actions: true, yes: d.portable ? 'Abrir descarga' : 'Actualizar' })
  } else if (d.state === 'downloading') {
    upd('Descargando actualización…', `${d.percent}%`, { bar: true })
    $('updFill').style.width = d.percent + '%'
  } else if (d.state === 'installing') {
    upd('Instalando…', 'Se reiniciará en un momento.', { bar: true })
    $('updFill').style.width = '100%'
  } else if (d.state === 'error' && !$('updBar').hidden) {
    $('upd').hidden = true
    toast('No se pudo actualizar. Inténtalo más tarde.', 5000)
  }
})

// Tras actualizarse y reabrirse, avisa de la versión nueva
window.poxi.version().then((v) => {
  let last = null
  try { last = localStorage.getItem('poxiclicker.ver'); localStorage.setItem('poxiclicker.ver', v) } catch {}
  if (last && last !== v) toast(`✅ Actualizado a la versión ${v}`, 5000)
})
