// Compila helper/clicker.cs con el csc.exe que ya trae Windows (.NET Framework 4): no hace falta instalar nada.
// Se salta si el .exe ya está más nuevo que el código.
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'helper', 'clicker.cs')
const out = path.join(__dirname, '..', 'helper', 'clicker.exe')

if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs) process.exit(0)

const win = process.env.WINDIR || 'C:\\Windows'
const csc = path.join(win, 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe')
if (!fs.existsSync(csc)) {
  console.error('No se encuentra csc.exe (.NET Framework 4 de 64 bits):', csc)
  process.exit(1)
}
execFileSync(csc, ['/nologo', '/target:exe', '/platform:x64', '/optimize+', '/out:' + out, src], { stdio: 'inherit' })
console.log('Ayudante compilado:', out)
