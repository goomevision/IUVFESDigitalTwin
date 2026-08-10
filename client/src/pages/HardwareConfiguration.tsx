import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_CONTROL_HARDWARE_CONFIG,
  saveControlHardwareConfig,
  type ControlHardwareConfig,
} from "@/lib/hardwareConfig";

const fieldClass = "w-full rounded-lg border border-cyan-500/20 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 outline-none focus:border-cyan-400";

export default function HardwareConfiguration() {
  const [config, setConfig] = useState<ControlHardwareConfig>(DEFAULT_CONTROL_HARDWARE_CONFIG);
  const [saved, setSaved] = useState(false);

  const setNumber = (key: keyof ControlHardwareConfig, value: string) => {
    const n = Number(value);
    setConfig((current) => ({ ...current, [key]: Number.isFinite(n) ? n : 0 }));
    setSaved(false);
  };

  const checks = useMemo(() => [
    ["Working volume → chamber volume", config.chamberVolumeL > 0],
    ["Pump capacity → vacuum dynamics", config.pumpCapacityM3h >= 0],
    ["Heating power → thermal dynamics", config.heatingPowerKW >= 0],
    ["Thermal mass → thermal dynamics", config.thermalMassKJPerC > 0],
    ["Cooling power → thermal dynamics", config.coolingPowerKW >= 0],
    ["Leak rate → pressure dynamics", config.leakRateMbarPerSecond >= 0],
  ] as const, [config]);

  const save = () => {
    saveControlHardwareConfig(config);
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_48%,#02040a_100%)] p-4 text-slate-100 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs tracking-[0.3em] text-cyan-400"><Lock className="h-4 w-4" />IUVFES // HARDWARE ENGINEERING</div>
              <h1 className="mt-2 text-2xl font-bold tracking-wide md:text-3xl">KONFIGURASI PERANGKAT KERAS STATIS</h1>
              <p className="mt-1 text-sm text-slate-400">Parameter fisik dikunci sebelum operasi. Pengaturan proses seperti suhu, tekanan, dan duty cycle dilakukan di Control Room.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Save className="mr-2 h-4 w-4" />SIMPAN HARDWARE</Button>
              <a href="/"><Button variant="outline" className="border-slate-700 bg-transparent">KEMBALI</Button></a>
            </div>
          </div>
        </header>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          <strong>HARDWARE LOCK:</strong> setelah simulasi berjalan, nilai pada layar ini tidak boleh diubah untuk session tersebut. Perubahan hardware harus membuat revision/design baru.
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr_0.8fr]">
          <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">1. VACUUM REACTOR — VR-001</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-400">Internal Diameter (mm)<input className={fieldClass} value="1000" readOnly /></label>
              <label className="text-xs text-slate-400">Shell Length (mm)<input className={fieldClass} value="1500" readOnly /></label>
              <label className="text-xs text-slate-400">Wall Thickness (mm)<input className={fieldClass} value="10" readOnly /></label>
              <label className="text-xs text-slate-400">Head Thickness (mm)<input className={fieldClass} value="10" readOnly /></label>
              <label className="text-xs text-slate-400">Working Volume (L)<input className={fieldClass} type="number" value={config.chamberVolumeL} onChange={(e) => setNumber("chamberVolumeL", e.target.value)} /></label>
              <label className="text-xs text-slate-400">Material<select className={fieldClass} defaultValue="SS316L"><option>SS316L</option><option>SS304</option></select></label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs">
              <div><span className="text-slate-500">Geometry status</span><div className="mt-1 text-yellow-300">SPECIFICATION INPUT</div></div>
              <div><span className="text-slate-500">Structural status</span><div className="mt-1 text-yellow-300">ENGINEERING REVIEW</div></div>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">2. THERMAL + VACUUM</h2>
            <div className="space-y-3">
              <label className="block text-xs text-slate-400">Heating Power (kW)<input className={fieldClass} type="number" value={config.heatingPowerKW} onChange={(e) => setNumber("heatingPowerKW", e.target.value)} /></label>
              <label className="block text-xs text-slate-400">Cooling Power (kW)<input className={fieldClass} type="number" value={config.coolingPowerKW} onChange={(e) => setNumber("coolingPowerKW", e.target.value)} /></label>
              <label className="block text-xs text-slate-400">Effective Thermal Mass (kJ/K)<input className={fieldClass} type="number" value={config.thermalMassKJPerC} onChange={(e) => setNumber("thermalMassKJPerC", e.target.value)} /></label>
              <label className="block text-xs text-slate-400">Pump Capacity (m³/h)<input className={fieldClass} type="number" value={config.pumpCapacityM3h} onChange={(e) => setNumber("pumpCapacityM3h", e.target.value)} /></label>
              <label className="block text-xs text-slate-400">Leak Rate (mbar/s)<input className={fieldClass} type="number" min="0" step="0.001" value={config.leakRateMbarPerSecond} onChange={(e) => setNumber("leakRateMbarPerSecond", e.target.value)} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
            <h2 className="mb-4 text-lg font-semibold text-cyan-300">3. WIRING STATUS</h2>
            <div className="space-y-2">
              {checks.map(([label, ok]) => <div key={label} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs"><CheckCircle2 className={`h-4 w-4 ${ok ? "text-emerald-400" : "text-red-400"}`} /><span>{label}</span></div>)}
            </div>
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-200">
              <div className="font-semibold">CONNECTED TO CLOSED-LOOP</div>
              <div className="mt-1 text-emerald-300/70">Saved values are sent as the hardware contract when a new simulation session starts.</div>
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-cyan-300">4. SYSTEM HARDWARE MAP</h2><p className="text-xs text-slate-500">Visual cable map: static hardware → dynamic physics.</p></div>{saved && <span className="font-mono text-xs text-emerald-300">SAVED • READY FOR SESSION</span>}</div>
          <div className="grid items-center gap-2 md:grid-cols-7">
            {["VR-001 REACTOR", "HJ-001 HEATER", "US-001 ULTRASONIC", "VP-001 PUMP", "CT-001..004 TRAPS", "SENSORS", "SAFETY"].map((item, i) => <div key={item} className="flex items-center gap-2"><div className="min-h-20 flex-1 rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3 text-center"><div className="text-xs font-semibold text-cyan-200">{item}</div><div className="mt-2 text-[10px] text-emerald-300">CONFIGURED</div></div>{i < 6 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-cyan-400 md:block" />}</div>)}
          </div>
        </section>

        <footer className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-500 md:flex-row md:justify-between">
          <span>Hardware baseline: IUVFES-VMMES-001</span><span>Revision required for physical changes</span><span>Dynamic operating controls remain in Control Room</span>
        </footer>
      </div>
    </div>
  );
}
