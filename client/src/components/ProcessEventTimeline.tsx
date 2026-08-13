import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
interface EventState { stage: Stage; elapsedSeconds: number; alarm: string | null; transitionReason: string; interlocks: { overTemperature: boolean; vacuumAchieved: boolean; allSystemsSafe: boolean }; }

export function ProcessEventTimeline({ timeline }: { timeline: EventState[] }) {
  const events: Array<{ key: string; time: number; stage: Stage; text: string; severity: "INFO" | "WARN" | "ALARM" }> = [];
  let previousStage: Stage | undefined;
  timeline.forEach((state, index) => {
    if (state.stage !== previousStage) { events.push({ key: `stage-${index}-${state.stage}`, time: state.elapsedSeconds, stage: state.stage, text: state.transitionReason, severity: state.stage === "FAULT" ? "ALARM" : "INFO" }); previousStage = state.stage; }
    if (state.alarm) events.push({ key: `alarm-${index}`, time: state.elapsedSeconds, stage: state.stage, text: state.alarm, severity: "ALARM" });
    if (state.interlocks.overTemperature && !state.alarm) events.push({ key: `thermal-${index}`, time: state.elapsedSeconds, stage: state.stage, text: "Thermal interlock active", severity: "WARN" });
  });
  const visible = events.slice(-16).reverse();
  return <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold tracking-wider text-cyan-300">EVENT / ALARM JOURNAL</h3><span className="font-mono text-[10px] text-slate-600">{events.length} EVENTS</span></div>{!visible.length ? <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs text-slate-500">Waiting for process events...</div> : <div className="max-h-64 space-y-2 overflow-y-auto pr-1">{visible.map(event => <div key={event.key} className="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3"><div className="mt-0.5">{event.severity === "ALARM" ? <AlertTriangle className="h-4 w-4 text-red-400" /> : event.severity === "WARN" ? <AlertTriangle className="h-4 w-4 text-yellow-400" /> : event.stage === "COMPLETE" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Info className="h-4 w-4 text-cyan-400" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 font-mono text-[10px]"><span className="text-slate-500">T+{event.time.toFixed(1)}s</span><span className="text-cyan-400">{event.stage}</span><span className={event.severity === "ALARM" ? "text-red-400" : event.severity === "WARN" ? "text-yellow-400" : "text-slate-500"}>{event.severity}</span></div><div className="mt-1 text-xs text-slate-300">{event.text}</div></div></div>)}</div>}</section>;
}
