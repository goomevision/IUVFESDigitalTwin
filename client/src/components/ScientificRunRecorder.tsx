import React, { useMemo } from "react";

export function ScientificRunRecorder({ experimentId, frames, completed }: { experimentId: string; frames: any[]; completed?: boolean }) {
  const summary = useMemo(() => {
    const last = frames.at(-1);
    return {
      rows: frames.length,
      duration: Number(last?.timestampSeconds ?? 0),
      temperature: Number(last?.sensorAfter?.temperatureC ?? 0),
      pressure: Number(last?.sensorAfter?.pressureMbar ?? 0),
    };
  }, [frames]);

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold tracking-wider text-cyan-300">SCIENTIFIC RUN RECORDER</h3>
          <p className="font-mono text-[10px] text-slate-600">{experimentId}</p>
        </div>
        <span className={`rounded-full px-3 py-1 font-mono text-[10px] ${completed ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
          {completed ? "COMPLETE" : "RECORDING"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 font-mono text-xs">
        <div><span className="text-slate-600">FRAMES</span><div className="text-cyan-300">{summary.rows}</div></div>
        <div><span className="text-slate-600">TIME</span><div className="text-cyan-300">{summary.duration.toFixed(1)} s</div></div>
        <div><span className="text-slate-600">TEMP</span><div className="text-cyan-300">{summary.temperature.toFixed(2)} °C</div></div>
        <div><span className="text-slate-600">PRESSURE</span><div className="text-cyan-300">{summary.pressure.toFixed(2)} mbar</div></div>
      </div>
    </section>
  );
}
