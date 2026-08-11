import { useMemo } from "react";

type TrendFrame = {
  timestampSeconds: number;
  sensorAfter: { temperatureC: number; pressureMbar: number };
  ultrasonic?: { effectivePowerKW?: number; powerDensityWPerL?: number };
  hardwareDiagnostics?: { coldTrapHeatLoadKw?: number; coldTrapCondensationCapacityKgPerSecond?: number };
  controlOutput?: { vacuumPumpPower?: number };
};

type Series = { key: string; label: string; unit: string; value: (f: TrendFrame) => number | undefined; tone: string };

const SERIES: Series[] = [
  { key: "temperature", label: "TEMPERATURE", unit: "°C", value: f => f.sensorAfter.temperatureC, tone: "text-cyan-300" },
  { key: "pressure", label: "PRESSURE", unit: "mbar", value: f => f.sensorAfter.pressureMbar, tone: "text-sky-300" },
  { key: "vacuum", label: "VACUUM OUTPUT", unit: "%", value: f => typeof f.controlOutput?.vacuumPumpPower === "number" ? f.controlOutput.vacuumPumpPower * 100 : undefined, tone: "text-indigo-300" },
  { key: "ultrasonic", label: "ULTRASONIC POWER", unit: "kW", value: f => f.ultrasonic?.effectivePowerKW, tone: "text-violet-300" },
  { key: "condensation", label: "CONDENSATION LOAD", unit: "kW", value: f => f.hardwareDiagnostics?.coldTrapHeatLoadKw, tone: "text-blue-300" },
];

function pathFor(values: Array<number | undefined>) {
  const valid = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (valid.length < 2) return "";
  const min = Math.min(...valid); const max = Math.max(...valid); const span = Math.max(1e-9, max - min);
  return values.map((v, i) => typeof v === "number" && Number.isFinite(v) ? `${(i / Math.max(1, values.length - 1)) * 100},${92 - ((v - min) / span) * 76}` : "").filter(Boolean).join(" ");
}

export function LiveProcessTrend({ frames }: { frames: ReadonlyArray<TrendFrame> }) {
  const recent = useMemo(() => frames.slice(-120), [frames]);
  const series = useMemo(() => SERIES.map(s => ({ ...s, values: recent.map(s.value), path: pathFor(recent.map(s.value)) })), [recent]);
  const lastTime = recent.at(-1)?.timestampSeconds;
  return <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><div className="text-[9px] tracking-[0.25em] text-slate-500">CAUSAL FRAME TELEMETRY</div><h2 className="font-semibold tracking-wider text-cyan-300">LIVE PROCESS TREND</h2></div><span className="font-mono text-[10px] text-slate-500">{recent.length} FRAMES · T+{typeof lastTime === "number" ? lastTime.toFixed(1) : "0.0"} s</span></div>
    <div className="grid gap-4 xl:grid-cols-[1fr_220px]"><div className="h-64 rounded-xl border border-slate-800 bg-slate-950 p-3"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full"><path d="M0 92 H100 M0 67 H100 M0 42 H100 M0 17 H100" stroke="currentColor" className="text-slate-800" strokeWidth="0.5" fill="none"/>{series.map(s => s.path ? <polyline key={s.key} points={s.path} fill="none" stroke="currentColor" className={s.tone} strokeWidth="1.25" vectorEffect="non-scaling-stroke" /> : null)}</svg></div><div className="space-y-2">{series.map(s => { const v = [...s.values].reverse().find(x => typeof x === "number" && Number.isFinite(x)); return <div key={s.key} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2"><div className={`text-[9px] tracking-wider ${s.tone}`}>{s.label}</div><div className="font-mono text-sm text-slate-200">{typeof v === "number" ? `${v.toFixed(3)} ${s.unit}` : "UNKNOWN"}</div><div className="text-[8px] text-slate-600">SOURCE: CAUSAL FRAME</div></div> })}</div></div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[8px] font-mono text-slate-600"><span>Each channel is independently normalized for visual comparison.</span><span>Values remain in their physical units.</span><span>No synthetic telemetry is generated.</span></div>
  </section>;
}
