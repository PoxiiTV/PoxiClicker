const $ = (id) => document.getElementById(id)
const root = document.documentElement
const KEY = 'poxiclicker.v1'
const DEFAULTS = { cps: 10, random: 0, button: 0, double: 0, fixed: 0, x: 0, y: 0, limit: 0, delay: 0, hotkey: 'F6', theme: 'dark', accent: 'blue', pin: false }

let s = { ...DEFAULTS }
try { s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

let running = false
let ready = false

function render() {
  root.dataset.theme = s.theme
  root.dataset.accent = s.accent
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
  $('toggle').classList.toggle('running', running)
  $('toggleLabel').textContent = !ready ? 'Iniciando…' : running ? 'Parar' : 'Iniciar'
  $('toggle').disabled = !ready
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

function start() {
  if (!ready) return
  running = true
  $('count').textContent = '0'
  render()
  window.poxi.start({ ...s, delay: Math.round(s.delay * 1000) })
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
$('accents').onclick = (e) => e.target.dataset.a && set({ accent: e.target.dataset.a })
$('theme').onclick = () => set({ theme: s.theme === 'dark' ? 'light' : 'dark' })
$('pin').onclick = () => { set({ pin: !s.pin }); window.poxi.pin(s.pin) }
$('min').onclick = () => window.poxi.win('min')
$('close').onclick = () => window.poxi.win('close')
$('toggle').onclick = toggle

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
    render()
  }
})

render()
window.poxi.pin(s.pin)
window.poxi.hotkey(s.hotkey).then((ok) => {
  if (!ok) { s.hotkey = 'F6'; window.poxi.hotkey('F6'); render() }
})
