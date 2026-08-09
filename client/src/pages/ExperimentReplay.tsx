import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type ReplayFrame = { time: number; temperature: number; pressure: number; oilRecovered: number };
type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE";
const stages: Array<{ id: Stage; label: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT" }, { id: "CHARGE", label: "CHARGE" }, { id: "VACUUM", label: "VACUUM" },
  { id: "HEAT_UP", label: "HEAT-UP" }, { id: "EXTRACTION", label: "EXTRACTION" }, { id: "CONDENSATION", label: "CONDENSATION" },
  { id: "COOL_DOWN", label: "COOL-DOWN" }, { id: "COMPLETE", label: "COMPLETE" },
];
function inferStage(frame: ReplayFrame, previous: ReplayFrame | undefined, final: boolean): Stage {
  if (final) return "COMPLETE";
  if (!previous || frame.time <= 1) return "PRE_FLIGHT";
  if (frame.time <= 5) return "CHARGE";
  if (frame.pressure > 250) return "VACUUM";
  if (frame.temperature < 55) return "HEAT_UP";
  if (frame.oilRecovered > 0) return "CONDENSATION";
  if (frame.temperature < 35) return "COOL_DOWN";
  return "EXTRACTION";
}

export default function ExperimentReplay({ experimentId }: { experimentId: string }) {
  const experiment = trpc.experiments.get.useQuery(experimentId);
  const results = trpc.simulation.getResults.useQuery(experimentId);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [speed, setSpeed] = useState(1);
  const frames = useMemo<ReplayFrame[]>(() => {
    const raw = results.data?.realTimeData as Array<Record<string, number>> | undefined;
    return raw?.map((f, i) => ({ time: Number(f.timestamp ?? f.time ?? i), temperature: Number(f.temperature ?? 25), pressure: Number(f.pressure ?? 1013.25), oilRecovered: Number(f.oilRecovered ?? 0) })) ?? [];
  }, [results.data]);
  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const timer = window.setInterval(() => setCursor(v => {
      if (v >= frames.length - 1) { setPlaying(false); return v; }
      return v + 1;
    }), Math.max(30, 160 / speed));
    return () => window.clearInterval(timer);
  }, [playing, frames.length, speed]);
  const frame = frames[cursor] ?? { time: 0, temperature: 25, pressure: 1013.25, oilRecovered: 0 };
  const previous = frames[Math.max(0, cursor - 1)];
  const stage = inferStage(frame, previous, frames.length > 0 && cursor === frames.length - 1);
  const stageIndex = stages.findIndex(s => s.id === stage);
  const progress = frames.length > 1 ? cursor / (frames.length - 1) : 0;
  const chart = frames.slice(Math.max(0, cursor - 100), cursor + 1).map((f, i, arr) => `${arr.length === 1 ? 0 : i / (arr.length - 1) * 100},${100 - Math.min(100, f.temperature / 150 * 100)}`).join(" ");
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-4 text-slate-100 md:p-6">
    <div className="mx-auto max-w-[1500px] space-y-4">
      <header className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs tracking-[0.35em] text-cyan-400">IUVFES // EXPERIMENT REPLAY</p><h1 className="mt-2 text-2xl font-bold">SCIENTIFIC EXPERIMENT REPLAY</h1><p className="font-mono text-xs text-slate-500">{experiment.data?.experimentName ?? experimentId}</p></div><Button variant="outline" className="border-slate-700 bg-transparent" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button></div></header>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">{stages.map((s, i) => <div key={s.id} className={`rounded-lg border p-3 ${i === stageIndex ? "border-cyan-400/70 bg-cyan-400/10" : i < stageIndex ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800"}`}><div className="font-mono text-[10px] text-slate-600">0{i + 1}</div><div className="mt-1 text-[11px] font-semibold tracking-wider">{s.label}</div></div>)}</div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress * 100}%` }} /></div></section>
      <div className="grid gap-4 lg:grid-cols-4">{[["TIME", `${frame.time.toFixed(1)} s`], ["PRESSURE", `${frame.pressure.toFixed(1)} mbar`], ["TEMPERATURE", `${frame.temperature.toFixed(1)} °C`], ["OIL RECOVERED", `${frame.oilRecovered.toFixed(3)} kg`]].map(([label, value]) => <div key={label} className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="text-xs tracking-widest text-slate-500">{label}</div><div className="mt-2 font-mono text-2xl text-cyan-300">{value}</div></div>)}</div>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold tracking-wider text-cyan-300">TIME-SERIES REPLAY</h2><span className="font-mono text-xs text-slate-500">FRAME {frames.length ? `${cursor + 1}/${frames.length}` : "0/0"}</span></div><div className="relative h-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />{chart && <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chart} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>}<div className="absolute bottom-3 left-3 font-mono text-[10px] text-slate-600">TEMPERATURE HISTORY • REPLAY CURSOR</div><div className="absolute bottom-0 top-0 w-px bg-amber-300" style={{ left: `${progress * 100}%` }} /></div></section>
      <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="flex flex-wrap items-center gap-2"><Button onClick={() => setCursor(0)} variant="outline" className="border-slate-700 bg-transparent"><SkipBack className="mr-2 h-4 w-4" />START</Button><Button onClick={() => setPlaying(v => !v)} disabled={!frames.length} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400">{playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{playing ? "PAUSE" : "PLAY"}</Button><Button onClick={() => setCursor(v => Math.max(0, v - 1))} variant="outline" className="border-slate-700 bg-transparent">-1 FRAME</Button><Button onClick={() => setCursor(v => Math.min(Math.max(0, frames.length - 1), v + 1))} variant="outline" className="border-slate-700 bg-transparent">+1 FRAME <SkipForward className="ml-2 h-4 w-4" /></Button><Button onClick={() => { setCursor(0); setPlaying(false); }} variant="outline" className="border-slate-700 bg-transparent"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button><label className="ml-auto flex items-center gap-2 font-mono text-xs text-slate-400">SPEED <select value={speed} onChange={e => setSpeed(Number(e.target.value))} className="rounded border border-slate-700 bg-slate-900 px-2 py-1"><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div><input aria-label="Replay timeline" type="range" min={0} max={Math.max(0, frames.length - 1)} value={cursor} onChange={e => { setPlaying(false); setCursor(Number(e.target.value)); }} className="mt-4 w-full accent-cyan-400" disabled={!frames.length} /></section>
      {!frames.length && !results.isLoading && <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-200">No simulation frames are available for this experiment yet. Run the experiment first, then return to Replay.</div>}
      {results.isError && <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">Replay data could not be loaded.</div>}
    </div>
  </div>;
}
