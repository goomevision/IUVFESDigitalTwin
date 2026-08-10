import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

function Channel({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] tracking-[0.18em] text-slate-500">{label}</span><span className="font-mono text-xs text-cyan-300">{Math.round(value * 100)}%</span></div><input className="w-full accent-cyan-400" type="range" min="0" max="1" step="0.01" value={value} onChange={e => onChange(Number(e.target.value))} /><div className="mt-3 h-24 rounded-lg bg-slate-950 p-2"><div className="flex h-full items-end"><div className="w-full rounded-sm bg-cyan-400/60 transition-all" style={{ height: `${Math.round(value * 100)}%` }} /></div></div><div className="mt-2 text-[9px] text-slate-600">ACTUATOR LIMIT · does not change PID coefficients</div></div>;
}

export function ControllerMixer({ experimentId, enabled }: { experimentId: string; enabled: boolean }) {
  const mutation = trpc.closedLoop.control.useMutation();
  const [heater, setHeater] = useState(1); const [pump, setPump] = useState(1); const [condenser, setCondenser] = useState(1); const [cooling, setCooling] = useState(1);
  const apply = async () => { if (!enabled) return; try { await mutation.mutateAsync({ experimentId, heaterMax: heater, vacuumPumpMax: pump, condenserMax: condenser, coolingMax: cooling, operatorNotes: "Operator actuator-limit adjustment from mixer controller." }); toast.success("Actuator limits applied"); } catch { toast.error("Actuator limit change rejected"); } };
  return <section className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-4"><div className="mb-4 flex items-center justify-between"><div><div className="flex items-center gap-2 text-[10px] tracking-[0.25em] text-slate-500"><SlidersHorizontal className="h-4 w-4 text-cyan-400" />MIXER-STYLE ACTUATOR CONTROL</div><h2 className="mt-1 text-lg font-semibold text-cyan-300">Operator Output Limits</h2></div><Button onClick={apply} disabled={!enabled || mutation.isPending} variant="outline" className="border-cyan-500/30">APPLY LIMITS</Button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Channel label="HEATER POWER" value={heater} onChange={setHeater} /><Channel label="VACUUM PUMP" value={pump} onChange={setPump} /><Channel label="CONDENSER" value={condenser} onChange={setCondenser} /><Channel label="COOLING" value={cooling} onChange={setCooling} /></div><p className="mt-3 text-xs text-slate-500">These controls cap the existing controller outputs. They do not replace the PID equations or the safety interlocks.</p></section>;
}