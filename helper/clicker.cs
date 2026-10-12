// Ayudante de PoxiClicker: hace los clics reales (SendInput) y habla con Electron por stdin/stdout.
// Comandos (los 9 parámetros comunes: cps botón doble aleatorio% límite fija x y retardoMs):
//   start <9 params> | hold <vk> <mods> <9 params> | stop | pos | quit
//   mods = suma de Ctrl(1) Alt(2) Shift(4). En "hold" clica solo mientras la tecla está pulsada
//   (y esa tecla no le llega al programa que tengas delante).
// Respuestas: ready | C <clics> | R <cps reales> | S (parado: límite alcanzado) | P <x> <y>
// Se compila con el csc.exe que ya trae Windows (C# 5): scripts/build-helper.js
using System;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Threading;

static class Clk
{
    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT { public int dx, dy; public uint mouseData, dwFlags, time; public IntPtr dwExtraInfo; }

    [StructLayout(LayoutKind.Explicit)]
    struct INPUT { [FieldOffset(0)] public uint type; [FieldOffset(8)] public MOUSEINPUT mi; }

    [StructLayout(LayoutKind.Sequential)]
    struct PT { public int X, Y; }

    [StructLayout(LayoutKind.Sequential)]
    struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam, lParam; public uint time; public int px, py; }

    delegate IntPtr HookProc(int code, IntPtr w, IntPtr l);

    [DllImport("user32.dll")] static extern uint SendInput(uint n, INPUT[] inputs, int size);
    [DllImport("user32.dll")] static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] static extern bool GetCursorPos(out PT p);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int vk);
    [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int id, HookProc cb, IntPtr mod, uint tid);
    [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr h, int code, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern int GetMessage(out MSG m, IntPtr hwnd, uint min, uint max);
    [DllImport("user32.dll")] static extern bool PostThreadMessage(uint tid, uint msg, IntPtr w, IntPtr l);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("kernel32.dll")] static extern IntPtr GetModuleHandle(string name);
    [DllImport("winmm.dll")] static extern uint timeBeginPeriod(uint p);

    static volatile bool run, watch, holdDown;
    static Thread th, wt, ht;
    static long total;
    static int holdVk, holdMods;
    static uint hookTid;
    static HookProc hookProc; // referencia estática: si el GC lo recoge, el hook se cae
    static readonly object gate = new object();
    static readonly INPUT[] buf = new INPUT[4];
    static readonly CultureInfo ci = CultureInfo.InvariantCulture;

    static void Say(string s) { lock (gate) { Console.Out.WriteLine(s); Console.Out.Flush(); } }
    static bool Down(int vk) { return (GetAsyncKeyState(vk) & 0x8000) != 0; }

    static INPUT Mk(uint flags)
    {
        INPUT i = new INPUT();
        i.type = 0; // INPUT_MOUSE
        i.mi.dwFlags = flags;
        return i;
    }

    static void Click(int btn, int dbl)
    {
        uint down = btn == 0 ? 2u : btn == 1 ? 8u : 32u;
        uint up = down << 1;
        int n = 0;
        for (int i = 0; i <= dbl; i++) { buf[n++] = Mk(down); buf[n++] = Mk(up); }
        SendInput((uint)n, buf, Marshal.SizeOf(typeof(INPUT)));
    }

    static void Loop(double cps, int btn, int dbl, int rnd, long limit, bool fix, int x, int y, int delay, long baseCount, bool hold)
    {
        Random r = new Random();
        Stopwatch sw = Stopwatch.StartNew();
        if (delay > 0) { while (run && sw.ElapsedMilliseconds < delay) Thread.Sleep(5); }
        double iv = 1000.0 / cps, next = sw.Elapsed.TotalMilliseconds;
        long n = baseCount, lastSay = 0, winCount = 0;
        double winStart = sw.Elapsed.TotalMilliseconds;
        while (run && (limit == 0 || n < limit))
        {
            if (fix) SetCursorPos(x, y);
            Click(btn, dbl);
            n++; winCount++;
            double now = sw.Elapsed.TotalMilliseconds;
            if (now - lastSay >= 100) { lastSay = (long)now; Say("C " + n); }
            if (now - winStart >= 500)
            {
                Say("R " + (winCount * 1000.0 / (now - winStart)).ToString("0.#", ci));
                winStart = now; winCount = 0;
            }
            next += iv * (1 + (rnd > 0 ? (r.NextDouble() * 2 - 1) * rnd / 100.0 : 0));
            if (next < now - 50) next = now; // si el PC se atasca no hace ráfaga para "recuperar"
            while (run)
            {
                double left = next - sw.Elapsed.TotalMilliseconds;
                if (left <= 0) break;
                if (left > 2) Thread.Sleep(1); else Thread.SpinWait(50);
            }
        }
        total = n;
        bool limited = limit > 0 && n >= limit;
        run = false;
        Say("C " + n);
        Say("R 0");
        // En "mantener", soltar la tecla no es "parar": solo avisamos si se llega al límite
        if (!hold || limited) { if (hold) watch = false; Say("S"); }
    }

    static void StartLoop(double cps, int btn, int dbl, int rnd, long lim, bool fix, int x, int y, int delay, bool hold)
    {
        run = true;
        long b = total;
        th = new Thread(delegate () { Loop(cps, btn, dbl, rnd, lim, fix, x, y, delay, b, hold); });
        th.IsBackground = true;
        th.Priority = ThreadPriority.AboveNormal;
        th.Start();
    }

    // Teclado global de bajo nivel: detecta la tecla del atajo y la "se come" para que no llegue al juego
    static bool ModsOk()
    {
        return ((holdMods & 1) == 0 || Down(0x11)) && ((holdMods & 2) == 0 || Down(0x12)) && ((holdMods & 4) == 0 || Down(0x10));
    }

    static IntPtr HookCb(int code, IntPtr w, IntPtr l)
    {
        if (code >= 0)
        {
            int vk = Marshal.ReadInt32(l);
            int msg = w.ToInt32();
            bool down = msg == 0x100 || msg == 0x104, up = msg == 0x101 || msg == 0x105;
            if (vk == holdVk && (down || up))
            {
                if (down && (holdDown || ModsOk())) { holdDown = true; return (IntPtr)1; }
                if (up && holdDown) { holdDown = false; return (IntPtr)1; }
            }
        }
        return CallNextHookEx(IntPtr.Zero, code, w, l);
    }

    static void HookThread()
    {
        hookTid = GetCurrentThreadId();
        hookProc = HookCb;
        IntPtr h = SetWindowsHookEx(13, hookProc, GetModuleHandle(Process.GetCurrentProcess().MainModule.ModuleName), 0);
        MSG m;
        while (GetMessage(out m, IntPtr.Zero, 0, 0) > 0) { }
        if (h != IntPtr.Zero) UnhookWindowsHookEx(h);
    }

    static void Watcher(double cps, int btn, int dbl, int rnd, long lim, bool fix, int x, int y, int delay)
    {
        while (watch)
        {
            bool clicking = run && th != null && th.IsAlive;
            if (holdDown && !clicking) StartLoop(cps, btn, dbl, rnd, lim, fix, x, y, delay, true);
            else if (!holdDown && clicking) { run = false; th.Join(500); }
            Thread.Sleep(4);
        }
    }

    public static bool Cmd(string line)
    {
        string[] p = line.Trim().TrimStart((char)0xFEFF).Split(' ');
        switch (p[0])
        {
            case "start":
            case "hold":
                {
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
                    holdVk = vk; holdMods = mods; holdDown = false;
                    ht = new Thread(HookThread); ht.IsBackground = true; ht.Start();
                    watch = true;
                    wt = new Thread(delegate () { Watcher(cps, btn, dbl, rnd, lim, fix, x, y, delay); });
                    wt.IsBackground = true;
                    wt.Start();
                    break;
                }
            case "stop": Stop(); break;
            case "pos": { PT pt; GetCursorPos(out pt); Say("P " + pt.X + " " + pt.Y); break; }
            case "quit": Stop(); return false;
        }
        return true;
    }

    static void Stop()
    {
        watch = false;
        run = false;
        holdDown = false;
        if (wt != null && wt.IsAlive && Thread.CurrentThread != wt) wt.Join(500);
        if (th != null && th.IsAlive) th.Join(500);
        if (ht != null && ht.IsAlive)
        {
            // la cola de mensajes del hilo puede tardar un instante en existir
            for (int i = 0; i < 40 && ht.IsAlive; i++)
            {
                if (hookTid != 0) PostThreadMessage(hookTid, 0x12, IntPtr.Zero, IntPtr.Zero); // WM_QUIT
                ht.Join(10);
            }
        }
        ht = null; hookTid = 0;
    }

    static void Main()
    {
        timeBeginPeriod(1);
        Say("ready");
        string l;
        while ((l = Console.In.ReadLine()) != null)
        {
            try { if (!Cmd(l)) break; } catch (Exception) { }
        }
        Stop();
    }
}
