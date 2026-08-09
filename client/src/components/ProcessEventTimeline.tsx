import React from "react";

export function ProcessEventTimeline({ timeline }: { timeline: any[] }) {
  const recent = timeline.slice(-20);
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4">
      <h3 className="mb-3 font-semibold tracking-wider text-cyan-300">EVENT TIMELINE</h3>
      <div className="max-h-48 overflow-auto space-y-2">
        {recent.length === 0 ? <div className="font-mono text-xs text-slate-600">NO FRAMES RECORDED</div> : recent.map((event, index) => (
          <div key={`${event.elapsedSeconds ?? index}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 font-mono text-xs">
            <span className="text-slate-500">t={Number(event.elapsedSeconds ?? 0).toFixed(1)}s</span>
            <span className="text-cyan-300">{event.stage ?? "PROCESS"}</span>
            <span className="text-slate-400">{event.transitionReason ?? "state update"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
