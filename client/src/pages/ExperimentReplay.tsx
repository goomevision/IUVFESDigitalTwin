import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";

type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
type ReplayFrame = {
  step: number;
  timestampSeconds: number;
  temperature: number;
  pressure: number;
  oilRecovered: number;
  waterRemoved: number;
  yieldPercent: number;
  energyKwh: number;
  stage: Stage;
  progress: number;
  alarm: string | null;
  source: "CAUSAL_FRAME" | "LEGACY_RESULT";
  raw: Record<string, unknown>;
};

const stages: Array<{ id: Stage; label: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT" }, { id: "CHARGE", label: "CHARGE" }, { id: "VACUUM", label: "VACUUM" },
  { id: "HEAT_UP", label: "HEAT-UP" }, { id: "EXTRACTION", label: "EXTRACTION" }, { id: "CONDENSATION", label: "CONDENSATION" },
  { id: "COOL_DOWN", label: "COOL-DOWN" }, { id: "COMPLETE", label: "COMPLETE" }, { id: "FAULT", label: "FAULT" },
];

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeFrame(raw: Record<string, unknown>, index: number): ReplayFrame {
  const sensorAfter = (raw.sensorAfter ?? raw.physicalSensorAfter ?? {}) as Record<string, unknown>;
  const controller = (raw.controller ?? {}) as Record<string, unknown>;
  const safety = (raw.safety ?? {}) as Record<string, unknown>;
  const hasCausalShape = Boolean(raw.sensorBefore && raw.controller && raw.effectiveCommands && raw.materialInventory && raw.safety);
  const stage = (safety.stage ?? controller.stage ?? "PRE_FLIGHT") as Stage;
  return {
    step: asNumber(raw.step, index + 1),
    timestampSeconds: asNumber(raw.timestampSeconds ?? raw.timestamp ?? raw.time, index),
    temperature: asNumber(sensorAfter.temperatureC ?? raw.temperature, 25),
    pressure: asNumber(sensorAfter.pressureMbar ?? raw.pressure, 1013.25),
    oilRecovered: asNumber(sensorAfter.oilRecoveredKg ?? raw.oilRecovered, 0),
    waterRemoved: asNumber(sensorAfter.waterRemovedKg ?? raw.waterRemoved, 0),
    yieldPercent: asNumber(sensorAfter.yieldPercent ?? raw.yieldPercent, 0),
    energyKwh: asNumber(sensorAfter.energyKwh ?? raw.energyKwh, 0),
    stage,
    progress: asNumber(controller.progress, stage === "COMPLETE" ? 1 : 0),
    alarm: typeof safety.alarm === "string" ? safety.alarm : typeof controller.alarm === "string" ? controller.alarm : null,
    source: hasCausalShape ? "CAUSAL_FRAME" : "LEGACY_RESULT",
    raw,
  };
}

export default function ExperimentReplay() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const experiment = trpc.experiments.get.useQuery(experimentId ?? "", { enabled: Boolean(experimentId) });
  const results = trpc.simulation.getResults.useQuery(experimentId ?? "", { enabled: Boolean(experimentId) });
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState(1);

  const frames = useMemo<ReplayFrame[]>(() => {
    const raw = results.data?.realTimeData as Array<Record<string, unknown>> | undefined;
    return raw?.map(normalizeFrame) ?? [];
  }, [results.data]);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setCursor(v => {
      if (v >= frames.length - 1) { setPlaying(false); return v; }
      return v + 1;
    }), Math.max(30, 160 / speed));
    return () => window.clearInterval(timer);
  }, [playing, frames.length, speed]);

  useEffect(() => {
    if (frames.length === 0) setCursor(0);
    else setCursor(v => Math.min(v, frames.length - 1));
  }, [frames.length]);

  const frame = frames[cursor];
  const stage = frame?.stage ?? "PRE_FLIGHT";
  const stageIndex = stages.findIndex(s => s.id === stage);
  const progress = frame?.progress ?? (frames.length > 1 ? cursor / (frames.length - 1) : 0);
  const chart = frames.slice(Math.max(0, cursor - 100), cursor + 1).map((f, i, arr) => `${arr.length === 1 ? 0 : i / (arr.length - 1) * 100},${100 - Math.min(100, f.temperature / 150 * 100)}`).join(" ");
  const isCausal = frame?.source === "CAUSAL_FRAME";

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6">
    <div className="mx-auto max-w-[1500px] space-y-4">
      <header className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // EXPERIMENT REPLAY</p><h1 className="mt-2 text-2xl font-bold">SCIENTIFIC EXPERIMENT REPLAY</h1><p className="font-mono text-xs text-slate-500">{experiment.data?.experimentName ?? experimentId ?? "UNKNOWN EXPERIMENT"}</p></div><Button variant="outline" className="border-slate-700 bg-transparent" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></div></header>

      {!frames.length && !results.isLoading && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">No persisted simulation frames are available for this experiment yet. Run the experiment first, then return to Replay.</div>}
      {results.isError && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">Replay data could not be loaded.</div>}

      {frame && <>
        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">{stages.map((s, i) => <div key={s.id} className={`rounded-lg border p-3 ${i === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : i < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800"}`}><div className="font-mono text-[10px] text-slate-600">0{i + 1}</div><div className="mt-1 text-[11px] font-semibold tracking-wider">{s.label}</div></div>)}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></div></section>

        <div className="grid gap-4 lg:grid-cols-4">{[["SIMULATION TIME", `${frame.timestampSeconds.toFixed(1)} s`], ["PRESSURE", `${frame.pressure.toFixed(2)} mbar`], ["TEMPERATURE", `${frame.temperature.toFixed(2)} °C`], ["OIL RECOVERED", `${frame.oilRecovered.toFixed(3)} kg`]].map(([label, value]) => <div key={label} className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="text-xs tracking-widest text-slate-500">{label}</div><div className="mt-2 font-mono text-2xl text-cyan-300">{value}</div></div>)}</div>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold tracking-wider text-cyan-300">TIME-SERIES REPLAY</h2><span className="font-mono text-xs text-slate-500">FRAME {cursor + 1}/{frames.length}</span></div><div className="relative h-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 0), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 0)", backgroundSize: "40px 40px" }} />{chart && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chart} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE HISTORY • PERSISTED FRAME DATA</div><div className="absolute bottom-0 top-0 w-px bg-amber-300" style={{ left: `${progress * 100}%` }} /></div></section>

        <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center gap-2"><Button onClick={() => setCursor(0)} variant="outline" className="border-slate-700 bg-transparent"><SkipBack className="mr-2 h-4 w-4" />START</Button><Button onClick={() => setPlaying(v => !v)} disabled={!frames.length} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{playing ? "PAUSE" : "PLAY"}</Button><Button onClick={() => setCursor(v => Math.max(0, v - 1))} variant="outline" className="border-slate-700 bg-transparent">-1 FRAME</Button><Button onClick={() => setCursor(v => Math.min(Math.max(0, frames.length - 1), v + 1))} variant="outline" className="border-slate-700 bg-transparent">+1 FRAME <SkipForward className="ml-2 h-4 w-4" /></Button><Button onClick={() => { setCursor(0); setPlaying(false); }} variant="outline" className="border-slate-700 bg-transparent"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><label className="ml-auto flex items-center gap-2 font-mono text-xs text-slate-400">SPEED <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-900 px-2 py-1"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div><input aria-label="Replay timeline" type="range" min={0} max={Math.max(0, frames.length - 1)} value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)); }} className="mt-4 w-full accent-cyan-400" disabled={!frames.length} /></section>

        <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.25em] text-emerald-400">DATA PROVENANCE</p><div className="mt-1 text-sm text-slate-300">{isCausal ? "CAUSAL FRAME • CLOSED-LOOP ENGINE" : "LEGACY RESULT FORMAT • LIMITED PROVENANCE"}</div></div><div className="font-mono text-xs text-slate-500">STEP {frame.step} • T+{frame.timestampSeconds.toFixed(2)}s</div></div>{frame.alarm && <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200"><AlertCircle className="h-4 w-4" />{frame.alarm}</div>}</section>
      </>}
    </div>
  </div>;
}
