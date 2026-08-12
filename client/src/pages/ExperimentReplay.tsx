import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Download, FileCheck2, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";

type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
type ReplayFrame = {
  step: number;
  timestampSeconds: number;
  temperature?: number;
  pressure?: number;
  oilRecovered?: number;
  waterRemoved?: number;
  yieldPercent?: number;
  energyKwh?: number;
  stage: Stage;
  progress?: number;
  alarm: string | null;
  raw: Record<string, unknown>;
};

const stages: Array<{ id: Stage; label: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT" }, { id: "CHARGE", label: "CHARGE" }, { id: "VACUUM", label: "VACUUM" },
  { id: "HEAT_UP", label: "HEAT-UP" }, { id: "EXTRACTION", label: "EXTRACTION" }, { id: "CONDENSATION", label: "CONDENSATION" },
  { id: "COOL_DOWN", label: "COOL-DOWN" }, { id: "COMPLETE", label: "COMPLETE" }, { id: "FAULT", label: "FAULT" },
];

function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function format(value: number | undefined, digits = 2): string {
  return typeof value === "number" ? value.toFixed(digits) : "—";
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeCausalFrame(raw: Record<string, unknown>): ReplayFrame | null {
  const sensorBefore = record(raw.sensorBefore);
  const controller = record(raw.controller);
  const effectiveCommands = record(raw.effectiveCommands);
  const materialInventory = record(raw.materialInventory);
  const safety = record(raw.safety);
  if (!Object.keys(sensorBefore).length || !Object.keys(controller).length || !Object.keys(effectiveCommands).length || !Object.keys(materialInventory).length || !Object.keys(safety).length) return null;
  const stageValue = safety.stage ?? controller.stage;
  if (typeof stageValue !== "string" || !stages.some(stage => stage.id === stageValue)) return null;
  const sensorAfter = record(raw.sensorAfter);
  return {
    step: finiteNumber(raw.step) ?? 0,
    timestampSeconds: finiteNumber(raw.timestampSeconds) ?? 0,
    temperature: finiteNumber(sensorAfter.temperatureC),
    pressure: finiteNumber(sensorAfter.pressureMbar),
    oilRecovered: finiteNumber(sensorAfter.oilRecoveredKg),
    waterRemoved: finiteNumber(sensorAfter.waterRemovedKg),
    yieldPercent: finiteNumber(sensorAfter.yieldPercent),
    energyKwh: finiteNumber(sensorAfter.energyKwh),
    stage: stageValue as Stage,
    progress: finiteNumber(controller.progress),
    alarm: typeof safety.alarm === "string" ? safety.alarm : null,
    raw,
  };
}

function temperaturePoints(frames: ReplayFrame[]): string {
  const values = frames.map(frame => frame.temperature);
  const available = values.filter((value): value is number => typeof value === "number");
  if (available.length < 2) return "";
  const min = Math.min(...available);
  const max = Math.max(...available);
  const span = Math.max(max - min, 0.001);
  return values.map((value, index) => typeof value === "number" ? `${index / Math.max(1, values.length - 1) * 100},${92 - ((value - min) / span * 76)}` : "").filter(Boolean).join(" ");
}

async function sha256(payload: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, "0")).join("");
}

function downloadJson(filename: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ExperimentReplay() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const experiment = trpc.experiments.get.useQuery(experimentId ?? "", { enabled: Boolean(experimentId) });
  const results = trpc.simulation.getResults.useQuery(experimentId ?? "", { enabled: Boolean(experimentId) });
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(0);

  const rawFrames = useMemo(() => Array.isArray(results.data?.realTimeData) ? results.data.realTimeData.filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value))) : [], [results.data]);
  const frames = useMemo(() => rawFrames.map(normalizeCausalFrame).filter((frame): frame is ReplayFrame => frame !== null), [rawFrames]);
  const unsupportedFrames = rawFrames.length - frames.length;

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setCursor(current => {
      if (current >= frames.length - 1) { setPlaying(false); return current; }
      return current + 1;
    }), Math.max(30, 160 / speed));
    return () => window.clearInterval(timer);
  }, [playing, frames.length, speed]);

  useEffect(() => {
    if (!frames.length) { setCursor(0); setRangeStart(0); setRangeEnd(0); return; }
    setCursor(value => Math.min(value, frames.length - 1));
    setRangeStart(value => Math.min(value, frames.length - 1));
    setRangeEnd(value => value === 0 ? frames.length - 1 : Math.min(value, frames.length - 1));
  }, [frames.length]);

  const frame = frames[cursor];
  const stageIndex = stages.findIndex(stage => stage.id === frame?.stage);
  const progress = frame?.progress ?? (frames.length > 1 ? cursor / (frames.length - 1) : 0);
  const chart = temperaturePoints(frames.slice(Math.max(0, cursor - 100), cursor + 1));
  const evidenceStart = Math.min(rangeStart, rangeEnd);
  const evidenceEnd = Math.max(rangeStart, rangeEnd);
  const evidenceFrames = frames.slice(evidenceStart, evidenceEnd + 1);

  const exportEvidence = async () => {
    if (!experimentId || !evidenceFrames.length) return;
    const evidence = {
      schema: "IUVFES-REPLAY-EVIDENCE-1",
      evidenceType: "SIMULATION_REPLAY",
      experimentId,
      source: "SIMULATION",
      sourceContract: "ClosedLoopSimulationEngine.CausalFrame",
      frameRange: { start: evidenceFrames[0].step, end: evidenceFrames.at(-1)?.step, count: evidenceFrames.length },
      generatedAt: new Date().toISOString(),
      scientificBoundary: "Simulation-derived evidence only. This package contains no laboratory measurement or experimental validation claim.",
      causalFrames: evidenceFrames.map(item => item.raw),
    };
    const canonicalPayload = JSON.stringify(evidence);
    downloadJson(`IUVFES-EVIDENCE-${experimentId}-${evidenceFrames[0].step}-${evidenceFrames.at(-1)?.step}.json`, { ...evidence, canonicalPayloadSha256: await sha256(canonicalPayload) });
  };

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6"><div className="mx-auto max-w-[1500px] space-y-4">
    <header className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // EXPERIMENT REPLAY</p><h1 className="mt-2 text-2xl font-bold">SCIENTIFIC EXPERIMENT REPLAY</h1><p className="font-mono text-xs text-slate-500">{experiment.data?.experimentName ?? experimentId ?? "UNKNOWN EXPERIMENT"}</p></div><Button variant="outline" className="border-slate-700 bg-transparent" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></div></header>

    {!frames.length && !results.isLoading && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">No structurally valid CausalFrame is available for this experiment. Replay will not substitute or invent missing telemetry.</div>}
    {unsupportedFrames > 0 && <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">{unsupportedFrames} persisted result frame(s) use an unsupported legacy format and are excluded from scientific replay evidence.</div>}
    {results.isError && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">Replay data could not be loaded.</div>}

    {frame && <>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-9">{stages.map((stage, index) => <div key={stage.id} className={`rounded-lg border p-3 ${index === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : index < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800"}`}><div className="font-mono text-[10px] text-slate-600">0{index + 1}</div><div className="mt-1 text-[11px] font-semibold tracking-wider">{stage.label}</div></div>)}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }} /></div></section>
      <div className="grid gap-4 lg:grid-cols-4">{[["SIMULATION TIME", `${format(frame.timestampSeconds, 1)} s`], ["PRESSURE", `${format(frame.pressure, 2)} mbar`], ["TEMPERATURE", `${format(frame.temperature, 2)} °C`], ["OIL RECOVERED", `${format(frame.oilRecovered, 3)} kg`]].map(([label, value]) => <div key={label} className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="text-xs tracking-widest text-slate-500">{label}</div><div className="mt-2 font-mono text-2xl text-cyan-300">{value}</div><div className="mt-2 text-[8px] tracking-[0.14em] text-slate-600">CAUSAL FRAME</div></div>)}</div>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold tracking-wider text-cyan-300">TIME-SERIES REPLAY</h2><span className="font-mono text-xs text-slate-500">FRAME {cursor + 1}/{frames.length}</span></div><div className="relative h-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 0), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 0)", backgroundSize: "40px 40px" }} />{chart ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chart} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg> : <div className="grid h-full place-items-center font-mono text-xs text-slate-600">INSUFFICIENT TEMPERATURE FRAMES</div>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE HISTORY • PERSISTED CAUSAL FRAME DATA</div><div className="absolute bottom-0 top-0 w-px bg-amber-300" style={{ left: `${progress * 100}%` }} /></div></section>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center gap-2"><Button onClick={() => setCursor(0)} variant="outline" className="border-slate-700 bg-transparent"><SkipBack className="mr-2 h-4 w-4" />START</Button><Button onClick={() => setPlaying(value => !value)} disabled={!frames.length} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{playing ? "PAUSE" : "PLAY"}</Button><Button onClick={() => setCursor(value => Math.max(0, value - 1))} variant="outline" className="border-slate-700 bg-transparent">-1 FRAME</Button><Button onClick={() => setCursor(value => Math.min(Math.max(0, frames.length - 1), value + 1))} variant="outline" className="border-slate-700 bg-transparent">+1 FRAME <SkipForward className="ml-2 h-4 w-4" /></Button><Button onClick={() => { setCursor(0); setPlaying(false); }} variant="outline" className="border-slate-700 bg-transparent"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><label className="ml-auto flex items-center gap-2 font-mono text-xs text-slate-400">SPEED <select value={speed} onChange={event => setSpeed(Number(event.target.value))} className="rounded border border-slate-700 bg-slate-900 px-2 py-1"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div><input aria-label="Replay timeline" type="range" min={0} max={Math.max(0, frames.length - 1)} value={cursor} onChange={event => { setPlaying(false); setCursor(Number(event.target.value)); }} className="mt-4 w-full accent-cyan-400" disabled={!frames.length} /></section>
      <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.25em] text-emerald-400">REPLAY EVIDENCE</p><div className="mt-1 text-sm text-slate-300">Export a selected CausalFrame window with SHA-256 integrity metadata.</div></div><Button onClick={() => void exportEvidence()} disabled={!evidenceFrames.length} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"><Download className="mr-2 h-4 w-4" />EXPORT EVIDENCE JSON</Button></div><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-[10px] tracking-[0.14em] text-slate-500">WINDOW START<input type="range" min={0} max={Math.max(0, frames.length - 1)} value={rangeStart} onChange={event => setRangeStart(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /><span className="mt-1 block font-mono text-emerald-300">FRAME #{frames[rangeStart]?.step ?? "—"}</span></label><label className="text-[10px] tracking-[0.14em] text-slate-500">WINDOW END<input type="range" min={0} max={Math.max(0, frames.length - 1)} value={rangeEnd} onChange={event => setRangeEnd(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /><span className="mt-1 block font-mono text-emerald-300">FRAME #{frames[rangeEnd]?.step ?? "—"}</span></label></div><div className="mt-3 flex items-center gap-2 text-[9px] text-slate-500"><FileCheck2 className="h-3.5 w-3.5 text-emerald-300" />{evidenceFrames.length} frame(s) selected. Source: SIMULATION; laboratory validation: not included.</div></section>
      <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.25em] text-emerald-400">DATA PROVENANCE</p><div className="mt-1 text-sm text-slate-300">CAUSAL FRAME • CLOSED-LOOP ENGINE</div></div><div className="font-mono text-xs text-slate-500">STEP {frame.step} • T+{format(frame.timestampSeconds, 2)}s</div></div>{frame.alarm && <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-200"><AlertCircle className="h-4 w-4" />{frame.alarm}</div>}<p className="mt-3 text-xs text-slate-500">Simulation-derived replay only. A CausalFrame proves execution traceability inside the model; it does not establish laboratory or experimental validation.</p></section>
    </>}
  </div></div>;
}
