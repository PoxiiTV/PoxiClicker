# Changelog

## 1.0.2

### 🇪🇸 Arreglos
- **El botón ya no se queda en «Iniciando…»**: el ayudante arrancaba tan rápido que a veces avisaba antes de que la interfaz estuviera lista
- **Lista de perfiles** con el estilo de la app (antes era el desplegable gris de Windows)

### 🇬🇧 Fixes
- **The button no longer gets stuck on "Starting…"**: the helper started so fast that it sometimes reported in before the interface was ready
- **Profile list** now matches the app style (it used to be the plain Windows dropdown)

## 1.0.1

### 🇪🇸 Novedades
- **Ayudante de clics nativo**: arranca al instante (antes tardaba ~1,5 s), usa `SendInput` y da menos falsos positivos con antivirus
- **CPS reales** medidos y mostrados junto a la velocidad mientras funciona
- **Modo Mantener**: la tecla del atajo ya no le llega al programa que tengas delante
- **Bandeja del sistema** (opcional): minimizar la esconde junto al reloj, con menú
- **Iniciar con Windows** (opcional), minimizado
- **Sonidos** al activar y parar (se pueden desactivar)
- **Español e inglés**, con el idioma del PC por defecto
- Nuevo panel de **Ajustes** con interruptores para todo lo anterior

### 🇬🇧 What's new
- **Native click helper**: starts instantly (it used to take ~1.5 s), uses `SendInput` and triggers fewer antivirus false positives
- **Actual CPS** measured and shown next to the speed while running
- **Hold mode**: the hotkey no longer reaches the program in front of you
- **System tray** (optional): minimizing hides it next to the clock, with a menu
- **Start with Windows** (optional), minimized
- **Sounds** on start and stop (can be turned off)
- **Spanish and English**, using the PC language by default
- New **Settings** panel with switches for all of the above

## 1.0.0

### 🇪🇸 Primera versión
- **Velocidad** de 0,1 a 500 CPS y **aleatoriedad** de hasta el 50 %
- **Botón** izquierdo, derecho o central, clic **simple o doble**
- **Posición** en el cursor o fija, con captura de coordenadas
- **Límites**: parar tras N clics y empezar tras N segundos
- **Atajo global** configurable (F6 por defecto)
- **6 colores** de acento, tema claro/oscuro y modo siempre visible, desde el icono de ajustes
- **Modo Simple** (lo básico) y **modo Avanzado** (límites, modo Mantener y perfiles)
- **Modo Mantener**: clica solo mientras mantienes pulsado el atajo
- **Perfiles** con nombre para guardar y cambiar de ajustes
- **Actualización automática**: avisa al abrir, descarga con barra, se instala en silencio y se reabre sola
- Instalador de un clic y versión portable

### 🇬🇧 First release
- **Speed** from 0.1 to 500 CPS and up to 50 % **randomness**
- Left, right or middle **button**, **single or double** click
- **Position** at the cursor or fixed, with coordinate capture
- **Limits**: stop after N clicks and start after N seconds
- Configurable **global hotkey** (F6 by default)
- **6 accent colors**, light/dark theme and always-on-top mode, from the settings icon
- **Simple mode** (the basics) and **Advanced mode** (limits, Hold mode and profiles)
- **Hold mode**: clicks only while you hold the hotkey
- Named **profiles** to save and switch settings
- **Auto-update**: asks on launch, downloads with a progress bar, installs silently and reopens itself
- One-click installer and portable version
