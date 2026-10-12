// Textos de la interfaz. Para añadir un idioma: copia el bloque "en", traduce y súmalo a LANGS.
const LANGS = ['es', 'en']
const I18N = {
  es: {
    'tb.theme': 'Cambiar tema', 'tb.cfg': 'Ajustes', 'tb.pin': 'Siempre visible', 'tb.min': 'Minimizar', 'tb.close': 'Cerrar',
    'menu.mode': 'Modo', 'level.simple': 'Simple', 'level.adv': 'Avanzado', 'level.simple.tip': 'Lo básico',
    'level.adv.tip': 'Límites, modo Mantener y perfiles',
    'menu.theme': 'Tema', 'theme.dark': 'Oscuro', 'theme.light': 'Claro',
    'menu.color': 'Color', 'color.blue': 'Azul', 'color.emerald': 'Verde', 'color.violet': 'Violeta',
    'color.pink': 'Rosa', 'color.amber': 'Naranja', 'color.red': 'Rojo',
    'menu.lang': 'Idioma', 'menu.tray': 'Minimizar a la bandeja', 'menu.startup': 'Iniciar con Windows', 'menu.sound': 'Sonidos',
    'hero.clicks': 'clics', 'mode.toggle': 'Alternar', 'mode.hold': 'Mantener',
    'mode.toggle.tip': 'Pulsas el atajo para empezar y otra vez para parar', 'mode.hold.tip': 'Clica solo mientras mantienes pulsado el atajo',
    'hero.hotkey': 'Atajo', 'hero.hotkey.tip': 'Cambiar atajo',
    'btn.starting': 'Iniciando…', 'btn.start': 'Iniciar', 'btn.stop': 'Parar', 'btn.arm': 'Activar', 'btn.disarm': 'Desactivar',
    'card.speed': 'Velocidad', 'interval': 'Un clic cada {ms} ms', 'real': 'real',
    'lbl.cps': 'Clics por segundo', 'lbl.random': 'Aleatoriedad',
    'card.click': 'Clic', 'btn.left': 'Izquierdo', 'btn.right': 'Derecho', 'btn.middle': 'Central',
    'type.single': 'Simple', 'type.double': 'Doble',
    'card.position': 'Posición', 'pos.cursor': 'En el cursor', 'pos.fixed': 'Fija', 'pos.capture': 'Capturar',
    'pos.capture.tip': 'Coloca el ratón donde quieras: se captura a los 3 s', 'pos.mouse': 'Ratón… {n}', 'pos.capturing': 'Capturando…',
    'card.limits': 'Límites', 'lim.stop': 'Parar tras', 'lim.clicks': 'clics (0 = ∞)', 'lim.start': 'Empezar tras', 'lim.s': 's',
    'card.profiles': 'Perfiles', 'profile.none': 'Sin perfil', 'profile.name': 'Nombre del perfil', 'profile.save': 'Guardar',
    'profile.delete': 'Borrar perfil', 'profile.saved': 'Perfil «{n}» guardado',
    'toast.holdKey': 'En modo Mantener el atajo debe ser una letra, un número, F1–F24 o Espacio',
    'upd.available': 'Versión {v} disponible', 'upd.ask': '¿Quieres actualizar ahora?',
    'upd.portable': 'Es la versión portable: se abrirá la página de descarga.', 'upd.yes': 'Actualizar', 'upd.open': 'Abrir descarga',
    'upd.later': 'Ahora no', 'upd.downloading': 'Descargando actualización…', 'upd.dontclose': 'No cierres la app, se reiniciará sola.',
    'upd.installing': 'Instalando…', 'upd.restarting': 'Se reiniciará en un momento.',
    'upd.error': 'No se pudo actualizar. Inténtalo más tarde.', 'upd.done': '✅ Actualizado a la versión {v}',
    'tray.show': 'Mostrar PoxiClicker', 'tray.start': 'Iniciar', 'tray.stop': 'Parar', 'tray.quit': 'Salir', 'tray.active': 'activo'
  },
  en: {
    'tb.theme': 'Switch theme', 'tb.cfg': 'Settings', 'tb.pin': 'Always on top', 'tb.min': 'Minimize', 'tb.close': 'Close',
    'menu.mode': 'Mode', 'level.simple': 'Simple', 'level.adv': 'Advanced', 'level.simple.tip': 'The basics',
    'level.adv.tip': 'Limits, Hold mode and profiles',
    'menu.theme': 'Theme', 'theme.dark': 'Dark', 'theme.light': 'Light',
    'menu.color': 'Color', 'color.blue': 'Blue', 'color.emerald': 'Green', 'color.violet': 'Violet',
    'color.pink': 'Pink', 'color.amber': 'Orange', 'color.red': 'Red',
    'menu.lang': 'Language', 'menu.tray': 'Minimize to tray', 'menu.startup': 'Start with Windows', 'menu.sound': 'Sounds',
    'hero.clicks': 'clicks', 'mode.toggle': 'Toggle', 'mode.hold': 'Hold',
    'mode.toggle.tip': 'Press the hotkey to start and again to stop', 'mode.hold.tip': 'Clicks only while you hold the hotkey',
    'hero.hotkey': 'Hotkey', 'hero.hotkey.tip': 'Change hotkey',
    'btn.starting': 'Starting…', 'btn.start': 'Start', 'btn.stop': 'Stop', 'btn.arm': 'Arm', 'btn.disarm': 'Disarm',
    'card.speed': 'Speed', 'interval': 'One click every {ms} ms', 'real': 'actual',
    'lbl.cps': 'Clicks per second', 'lbl.random': 'Randomness',
    'card.click': 'Click', 'btn.left': 'Left', 'btn.right': 'Right', 'btn.middle': 'Middle',
    'type.single': 'Single', 'type.double': 'Double',
    'card.position': 'Position', 'pos.cursor': 'At cursor', 'pos.fixed': 'Fixed', 'pos.capture': 'Capture',
    'pos.capture.tip': 'Place the mouse anywhere: it is captured after 3 s', 'pos.mouse': 'Mouse… {n}', 'pos.capturing': 'Capturing…',
    'card.limits': 'Limits', 'lim.stop': 'Stop after', 'lim.clicks': 'clicks (0 = ∞)', 'lim.start': 'Start after', 'lim.s': 's',
    'card.profiles': 'Profiles', 'profile.none': 'No profile', 'profile.name': 'Profile name', 'profile.save': 'Save',
    'profile.delete': 'Delete profile', 'profile.saved': 'Profile «{n}» saved',
    'toast.holdKey': 'In Hold mode the hotkey must be a letter, a number, F1–F24 or Space',
    'upd.available': 'Version {v} available', 'upd.ask': 'Do you want to update now?',
    'upd.portable': 'This is the portable version: the download page will open.', 'upd.yes': 'Update', 'upd.open': 'Open download',
    'upd.later': 'Not now', 'upd.downloading': 'Downloading update…', 'upd.dontclose': 'Do not close the app, it will restart by itself.',
    'upd.installing': 'Installing…', 'upd.restarting': 'It will restart in a moment.',
    'upd.error': 'The update failed. Try again later.', 'upd.done': '✅ Updated to version {v}',
    'tray.show': 'Show PoxiClicker', 'tray.start': 'Start', 'tray.stop': 'Stop', 'tray.quit': 'Quit', 'tray.active': 'active'
  }
}

// Idioma del sistema la primera vez; después, el que elijas
const systemLang = () => (String(navigator.language).toLowerCase().startsWith('es') ? 'es' : 'en')
let lang = systemLang()

const t = (key, vars = {}) =>
  (I18N[lang][key] ?? I18N.es[key] ?? key).replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? vars[k] : ''))

// Rellena todo lo marcado en el HTML: data-i18n (texto), data-i18n-title, data-i18n-ph (placeholder), data-i18n-aria
function applyI18n() {
  document.documentElement.lang = lang
  document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)))
  document.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle)))
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => (el.placeholder = t(el.dataset.i18nPh)))
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)))
}
