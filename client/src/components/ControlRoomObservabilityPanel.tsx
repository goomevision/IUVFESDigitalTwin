import { useEffect, useState } from "react";
import { Activity, ShieldCheck } from "lucide-react";
import { type ControlRoomObservabilityEvent, getControlRoomEvents, subscribeControlRoomEvents } from "@/lib/controlRoomObservability";

function eventTone(result: ControlRoomObservabilityEvent["result"]) {
  if (result === "SUCCESS") return "text-emerald-300";
  if (result === "ERROR" || result === "FAILURE") return "text-red-300";
  if (result === "BLOCKED") return "text-amber-300";
  return "text-cyan-300";
}

export function ControlRoomObservabilityPanel() {
  const [events, setEvents] = useState<readonly ControlRoomObservabilityEvent[]>(() => getControlRoomEvents());
  useEffect(() => subscribeControlRoomEvents(setEvents), []);
  const recent = events.slice(-10).reverse();
  return <section className="border border-slate-800 bg-slate-950/70 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-cyan-300"><Activity className="h-3.5 w-3.5" />OPERATIONAL OBSERVABILITY</div><span className="inline-flex items-center gap-1 font-mono text-[8px] text-slate-500"><ShieldCheck className="h-3 w-3 text-emerald-300" />NON-SCIENTIFIC</span></div><p className="mt-2 text-[9px] leading-relaxed text-slate-500">Browser-local operational events only. Scientific values, CausalFrame payloads, credentials, and tokens are excluded.</p><div className="mt-3 max-h-52 space-y-1 overflow-auto font-mono text-[9px]">{recent.length ? recent.map(event => <div key={event.id} className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-slate-800/70 py-1.5 last:border-0"><span className={eventTone(event.result)}>●</span><span className="min-w-0 truncate text-slate-300">{event.event}{event.componentId ? ` · ${event.componentId}` : ""}{event.frameRef?.step !== undefined ? ` · FRAME ${event.frameRef.step}` : ""}</span><span className="text-slate-600">{event.result}</span></div>) : <div className="text-slate-600">No operational events recorded yet.</div>}</div></section>;
}
