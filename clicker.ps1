# Ayudante de PoxiClicker: hace los clics reales (user32) y habla con Electron por stdin/stdout.
# Comandos (los 9 parametros comunes: cps boton doble aleatorio% limite fija x y retardoMs):
#   start <9 params> | hold <vk> <mods> <9 params> | stop | pos | quit
#   mods = suma de Ctrl(1) Alt(2) Shift(4). En "hold" clica solo mientras la tecla esta pulsada.
Add-Type -TypeDefinition @'
using System;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Threading;

public static class Clk {
  [DllImport("user32.dll")] static extern void mouse_event(uint f, int dx, int dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
  [StructLayout(LayoutKind.Sequential)] struct PT { public int X, Y; }
  [DllImport("user32.dll")] static extern bool GetCursorPos(out PT p);
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);
  [DllImport("winmm.dll")] static extern uint timeBeginPeriod(uint p);

  static volatile bool run, watch;
  static Thread th, wt;
  static long total;
  static readonly object gate = new object();

  static void Say(string s) { lock (gate) { Console.Out.WriteLine(s); Console.Out.Flush(); } }
  static bool Down(int vk) { return (GetAsyncKeyState(vk) & 0x8000) != 0; }

  static void Click(int btn, int dbl) {
    uint down = btn == 0 ? 2u : btn == 1 ? 8u : 32u;
    uint up = down << 1;
    for (int i = 0; i <= dbl; i++) { mouse_event(down, 0, 0, 0, UIntPtr.Zero); mouse_event(up, 0, 0, 0, UIntPtr.Zero); }
  }

  static void Loop(double cps, int btn, int dbl, int rnd, long limit, bool fix, int x, int y, int delay, long baseCount, bool hold) {
    var r = new Random();
    var sw = Stopwatch.StartNew();
    if (delay > 0) { while (run && sw.ElapsedMilliseconds < delay) Thread.Sleep(5); }
    double iv = 1000.0 / cps, next = sw.Elapsed.TotalMilliseconds;
    long n = baseCount, lastSay = 0;
    while (run && (limit == 0 || n < limit)) {
      if (fix) SetCursorPos(x, y);
      Click(btn, dbl);
      n++;
      double now = sw.Elapsed.TotalMilliseconds;
      if (now - lastSay >= 100) { lastSay = (long)now; Say("C " + n); }
      next += iv * (1 + (rnd > 0 ? (r.NextDouble() * 2 - 1) * rnd / 100.0 : 0));
      if (next < now - 50) next = now; // si el PC se atasca no hace ráfaga para "recuperar"
      while (run) {
        double left = next - sw.Elapsed.TotalMilliseconds;
        if (left <= 0) break;
        if (left > 2) Thread.Sleep(1); else Thread.SpinWait(50);
      }
    }
    total = n;
    bool limited = limit > 0 && n >= limit;
    run = false;
    Say("C " + n);
    // En "mantener", soltar la tecla no es "parar": solo avisamos si se llega al límite
    if (!hold || limited) { if (hold) watch = false; Say("S"); }
  }

  static void StartLoop(double cps, int btn, int dbl, int rnd, long lim, bool fix, int x, int y, int delay, bool hold) {
    run = true;
    long b = total;
    th = new Thread(() => Loop(cps, btn, dbl, rnd, lim, fix, x, y, delay, b, hold)) { IsBackground = true, Priority = ThreadPriority.AboveNormal };
    th.Start();
  }

  public static bool Cmd(string line) {
    var p = line.Trim().Split(' ');
    var ci = CultureInfo.InvariantCulture;
    switch (p[0]) {
      case "start":
      case "hold": {
        Stop();
        bool hold = p[0] == "hold";
        int o = hold ? 3 : 1;
        int vk = hold ? int.Parse(p[1]) : 0, mods = hold ? int.Parse(p[2]) : 0;
        double cps = Math.Max(0.1, Math.Min(500, double.Parse(p[o], ci)));
        int btn = int.Parse(p[o + 1]), dbl = int.Parse(p[o + 2]), rnd = int.Parse(p[o + 3]);
        long lim = long.Parse(p[o + 4]);
        bool fix = p[o + 5] == "1";
        int x = int.Parse(p[o + 6]), y = int.Parse(p[o + 7]), delay = int.Parse(p[o + 8]);
        total = 0;
        if (!hold) { StartLoop(cps, btn, dbl, rnd, lim, fix, x, y, delay, false); break; }
        watch = true;
        wt = new Thread(() => {
          while (watch) {
            // cada modificador exigido (Ctrl/Alt/Shift) tiene que estar pulsado
            bool pressed = Down(vk) &&((mods & 1) == 0 || Down(0x11)) && ((mods & 2) == 0 || Down(0x12)) && ((mods & 4) == 0 || Down(0x10));
            bool clicking = run && th != null && th.IsAlive;
            if (pressed && !clicking) StartLoop(cps, btn, dbl, rnd, lim, fix, x, y, delay, true);
            else if (!pressed && clicking) { run = false; th.Join(500); }
            Thread.Sleep(4);
          }
        }) { IsBackground = true };
        wt.Start();
        break;
      }
      case "stop": Stop(); break;
      case "pos": { PT pt; GetCursorPos(out pt); Say("P " + pt.X + " " + pt.Y); break; }
      case "quit": Stop(); return false;
    }
    return true;
  }

  static void Stop() {
    watch = false;
    run = false;
    if (wt != null && wt.IsAlive && Thread.CurrentThread != wt) wt.Join(500);
    if (th != null && th.IsAlive) th.Join(500);
  }

  public static void Init() { timeBeginPeriod(1); Say("ready"); }
}
'@

[Clk]::Init()
while (($l = [Console]::In.ReadLine()) -ne $null) { if (-not [Clk]::Cmd($l)) { break } }
