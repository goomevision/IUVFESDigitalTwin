import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { CausalFrame as ReplayFrame } from "../../../server/closedLoopSimulation";

export function ProcessRunReplay({ frames, onFrameChange }: { frames: ReadonlyArray<ReplayFrame>; onFrameChange?: (frame: ReplayFrame | undefined, index: number) => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);
  const current = frames.length ? frames[Math.min(index, frames.length - 1)] : undefined;
  const progress = frames.length > 1 ? (Math.min(index, frames.length - 1) / (frames.length - 1)) * 100 : 0;
  const interval = useMemo(() => Math.max(80, Math.round(1000 / speed)), [speed]);

  const select = (next: number) => {
    const safe = Math.max(0, Math.min(next, Math.max(0, frames.length - 1)));
    setIndex(safe);
    onFrameChange?.(frames[safe], safe);
  };

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    timer.current = window.setInterval(() => {
      setIndex(previous => {
        const next = previous + 1;
        if (next >= frames.length) {
          setPlaying(false);
          return frames.length - 1;
        }
        onFrameChange?.(frames[next], next);
        return next;
      });
    }, interval);
    return () => { if (timer.current !== null) window.clearInterval(timer.current); timer.current = null; };
  }, [playing, interval, frames, onFrameChange]);

  useEffect(() => {
    if (!frames.length) { setIndex(0); setPlaying(false); return; }
    if (index >= frames.length) setIndex(frames.length - 1);
  }, [frames.length, index]);

  return <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div><div className="text-[9px] tracking-[0.25em] text-slate-500">RUN REPLAY</div><h3 className="font-semibold tracking-wider text-cyan-300">PROCESS TIME MACHINE</h3></div>
      <div className="font-mono text-[10px] text-slate-500">{current ? `FRAME #${current.step} · T+${current.timestampSeconds.toFixed(1)} s` : "WAITING FOR RUN"}</div>
    </div>
    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
      <input aria-label="Replay timeline" disabled={!frames.length} className="w-full accent-cyan-400" type="range" min={0} max={Math.max(0, frames.length - 1)} value={Math.min(index, Math.max(0, frames.length - 1))} onChange={e => select(Number(e.target.value))}/>
      <div className="mt-1 flex justify-between font-mono text-[8px] text-slate-600"><span>FRAME 0</span><span>{frames.length ? `FRAME ${frames.length - 1}` : "NO FRAMES"}</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900"><div className="h-full bg-cyan-400/70 transition-all" style={{ width: `${progress}%` }}/></div>
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" disabled={!frames.length} onClick={() => select(0)}><SkipBack className="mr-1 h-3.5 w-3.5"/>START</Button>
      <Button size="sm" disabled={!frames.length} onClick={() => setPlaying(v => !v)}>{playing ? <Pause className="mr-1 h-3.5 w-3.5"/> : <Play className="mr-1 h-3.5 w-3.5"/>}{playing ? "PAUSE" : "PLAY"}</Button>
      <Button size="sm" variant="outline" disabled={!frames.length} onClick={() => select(index - 1)}><SkipBack className="h-3.5 w-3.5"/></Button>
      <Button size="sm" variant="outline" disabled={!frames.length} onClick={() => select(index + 1)}><SkipForward className="h-3.5 w-3.5"/></Button>
      <Button size="sm" variant="outline" disabled={!frames.length} onClick={() => { select(0); setPlaying(false); }}><RotateCcw className="mr-1 h-3.5 w-3.5"/>RESET</Button>
      <select aria-label="Replay speed" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200">
        <option value={0.5}>0.5×</option><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option><option value={8}>8×</option>
      </select>
    </div>
    {current && <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">STAGE</div><div className="font-mono text-[10px] text-cyan-300">{current.controller?.stage ?? "—"}</div></div>
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">TEMP</div><div className="font-mono text-[10px] text-slate-200">{current.sensorAfter?.temperatureC?.toFixed(1) ?? "—"} °C</div></div>
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">PRESSURE</div><div className="font-mono text-[10px] text-slate-200">{current.sensorAfter?.pressureMbar?.toFixed(1) ?? "—"} mbar</div></div>
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">YIELD</div><div className="font-mono text-[10px] text-emerald-300">{current.sensorAfter?.yieldPercent?.toFixed(2) ?? "—"} %</div></div>
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">ACTUATORS</div><div className="font-mono text-[9px] text-slate-300">{Object.entries(current.effectiveCommands ?? {}).filter(([,v]) => v).map(([k]) => k).join(", ") || "NONE"}</div></div>
      <div className="rounded-lg border border-slate-800 p-2"><div className="text-[8px] text-slate-600">SAFETY</div><div className={`font-mono text-[9px] ${current.safety?.allSystemsSafe ? "text-emerald-300" : "text-red-300"}`}>{current.safety?.allSystemsSafe ? "SAFE" : (current.safety?.alarm ?? "CHECK")}</div></div>
    </div>}
  </section>;
}
