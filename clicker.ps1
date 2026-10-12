# Ayudante de PoxiClicker: hace los clics reales (user32) y habla con Electron por stdin/stdout.
# Comandos: start <cps> <boton 0-2> <doble 0|1> <aleatorio %> <limite> <fija 0|1> <x> <y> <retardo ms> | stop | pos | quit
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
  [DllImport("winmm.dll")] static extern uint timeBeginPeriod(uint p);

  static volatile bool run;
  static Thread th;
  static readonly object gate = new object();

  static void Say(string s) { lock (gate) { Console.Out.WriteLine(s); Console.Out.Flush(); } }

  static void Click(int btn, int dbl) {
    uint down = btn == 0 ? 2u : btn == 1 ? 8u : 32u;
    uint up = down << 1;
    for (int i = 0; i <= dbl; i++) { mouse_event(down, 0, 0, 0, UIntPtr.Zero); mouse_event(up, 0, 0, 0, UIntPtr.Zero); }
  }

  static void Loop(double cps, int btn, int dbl, int rnd, long limit, bool fix, int x, int y, int delay) {
    var r = new Random();
    var sw = Stopwatch.StartNew();
    if (delay > 0) { while (run && sw.ElapsedMilliseconds < delay) Thread.Sleep(5); }
    double iv = 1000.0 / cps, next = sw.Elapsed.TotalMilliseconds;
    long n = 0, lastSay = 0;
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
    run = false;
    Say("C " + n);
    Say("S");
  }

  public static bool Cmd(string line) {
    var p = line.Trim().Split(' ');
    var ci = CultureInfo.InvariantCulture;
    switch (p[0]) {
      case "start":
        Stop();
        run = true;
        double cps = Math.Max(0.1, Math.Min(500, double.Parse(p[1], ci)));
        int btn = int.Parse(p[2]), dbl = int.Parse(p[3]), rnd = int.Parse(p[4]);
        long lim = long.Parse(p[5]);
        bool fix = p[6] == "1";
        int x = int.Parse(p[7]), y = int.Parse(p[8]), delay = int.Parse(p[9]);
        th = new Thread(() => Loop(cps, btn, dbl, rnd, lim, fix, x, y, delay)) { IsBackground = true, Priority = ThreadPriority.AboveNormal };
        th.Start();
        break;
      case "stop": Stop(); break;
      case "pos": { PT pt; GetCursorPos(out pt); Say("P " + pt.X + " " + pt.Y); break; }
      case "quit": Stop(); return false;
    }
    return true;
  }

  static void Stop() { run = false; if (th != null && th.IsAlive) th.Join(500); }

  public static void Init() { timeBeginPeriod(1); Say("ready"); }
}
'@

[Clk]::Init()
while (($l = [Console]::In.ReadLine()) -ne $null) { if (-not [Clk]::Cmd($l)) { break } }
