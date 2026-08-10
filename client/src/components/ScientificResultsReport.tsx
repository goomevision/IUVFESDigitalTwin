import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type ResultFrame = {
  step: number;
  timestampSeconds: number;
  sensorAfter: { pressureMbar:number; temperatureC:number; yieldPercent:number; waterRemovedKg:number; oilRecoveredKg:number; energyKwh:number };
  safety?: { stage:string; allSystemsSafe:boolean; alarm:string|null; transitionReason:string };
  materialInventory?: { initialMassKg?:number; remainingMassKg?:number; waterInitialKg?:number; waterRemovedKg?:number; waterRemainingKg?:number; oilPotentialKg?:number; oilRecoveredKg?:number; oilRemainingPotentialKg?:number; recoveryPercent?:number };
  ultrasonic?: { massTransferMultiplier?:number; effectiveFrequencyKHz?:number; effectivePowerKW?:number; powerDensityWPerL?:number; status?:string; warnings?:string[] };
  hardwareDiagnostics?: { connectedVolumeL?:number; pipeVolumeL?:number; vacuumConductanceM3h?:number|null; effectivePumpCapacityM3h?:number; coldTrapHeatLoadKw?:number; coldTrapCondensationCapacityKgPerSecond?:number; coldTrapStageCondensedWaterKg?:number[]; hardwareWarnings?:string[] };
};

function n(value: unknown, digits=3) { return typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "—"; }
function latestOf(frames: readonly ResultFrame[]) { return frames.at(-1); }

export function ScientificResultsReport({ experimentId, frames, completed }: { experimentId:string; frames:ReadonlyArray<ResultFrame>; completed:boolean }) {
  const experiment = trpc.experiments.get.useQuery(experimentId);
  const latest = latestOf(frames);
  const first = frames[0];
  const p = (experiment.data?.inputParameters ?? {}) as Record<string, unknown>;
  const printReport = () => window.print();
  const downloadJson = () => {
    const payload = { experimentId, generatedAt:new Date().toISOString(), status:completed ? "COMPLETE" : "LIVE", source:"ClosedLoopSimulationEngine", frameCount:frames.length, experiment:experiment.data ?? null, frames };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`IUVFES-${experimentId}-results.json`; a.click(); URL.revokeObjectURL(url);
  };
  const stages = Array.from(new Set(frames.map(f => f.safety?.stage).filter(Boolean)));
  return <section className="scientific-report rounded-2xl border border-emerald-500/20 bg-slate-950/80 p-4 md:p-6">
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div><div className="font-mono text-[10px] tracking-[0.3em] text-emerald-400">SCIENTIFIC OUTPUT</div><h2 className="mt-1 text-xl font-semibold text-emerald-300">Experiment Results & Journal Report</h2><p className="text-xs text-slate-500">Connected directly to the live causal frames — no mock result layer.</p></div>
      <div className="flex gap-2 print:hidden"><Button variant="outline" onClick={downloadJson} disabled={!frames.length}><FileText className="mr-2 h-4 w-4"/>EXPORT JSON</Button><Button onClick={printReport} disabled={!frames.length} className="bg-emerald-500 text-slate-950"><Printer className="mr-2 h-4 w-4"/>PRINT / SAVE PDF</Button></div>
    </div>
    {!frames.length ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Belum ada causal frame. Jalankan simulasi terlebih dahulu agar laporan mengambil hasil nyata dari engine.</div> : <>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="EXPERIMENT" value={experimentId}/><Metric label="STATUS" value={completed ? "COMPLETE" : "LIVE"}/><Metric label="FRAMES" value={String(frames.length)}/><Metric label="PROCESS TIME" value={`${n(latest?.timestampSeconds,1)} s`}/>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ReportBlock title="1. Experiment & Material"><Row k="Experiment name" v={String(experiment.data?.experimentName ?? "—")}/><Row k="Material ID" v={String(experiment.data?.materialId ?? "—")}/><Row k="Material mass" v={String(p.materialWeight ?? "—")}/><Row k="Water content" v={String(p.waterContent ?? "—")}/><Row k="Oil content" v={String(p.oilContent ?? "—")}/><Row k="Objective" v={String(p.objective ?? "—")}/></ReportBlock>
        <ReportBlock title="2. Operating Inputs"><Row k="Target pressure" v={String(p.targetPressure ?? "from controller")}/><Row k="Target temperature" v={String(p.targetTemperature ?? "from controller")}/><Row k="Cooling target" v={String(p.coolingTemperature ?? "from controller")}/><Row k="First pressure" v={`${n(first?.sensorAfter.pressureMbar,2)} mbar`}/><Row k="First temperature" v={`${n(first?.sensorAfter.temperatureC,2)} °C`}/><Row k="Stages observed" v={stages.join(" → ") || "—"}/></ReportBlock>
      </div>
      <ReportBlock title="3. Final Process Results" className="mt-4"><div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6"><Metric label="TEMP" value={`${n(latest?.sensorAfter.temperatureC,2)} °C`}/><Metric label="PRESSURE" value={`${n(latest?.sensorAfter.pressureMbar,2)} mbar`}/><Metric label="YIELD" value={`${n(latest?.sensorAfter.yieldPercent,2)} %`}/><Metric label="OIL" value={`${n(latest?.sensorAfter.oilRecoveredKg,3)} kg`}/><Metric label="WATER" value={`${n(latest?.sensorAfter.waterRemovedKg,3)} kg`}/><Metric label="ENERGY" value={`${n(latest?.sensorAfter.energyKwh,3)} kWh`}/></div></ReportBlock>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReportBlock title="4. Mass Balance"><Row k="Initial mass" v={`${n(latest?.materialInventory?.initialMassKg,3)} kg`}/><Row k="Remaining mass" v={`${n(latest?.materialInventory?.remainingMassKg,3)} kg`}/><Row k="Water removed" v={`${n(latest?.materialInventory?.waterRemovedKg,3)} kg`}/><Row k="Oil recovered" v={`${n(latest?.materialInventory?.oilRecoveredKg,3)} kg`}/><Row k="Recovery" v={`${n(latest?.materialInventory?.recoveryPercent,2)} %`}/></ReportBlock>
        <ReportBlock title="5. Hardware / Ultrasonic Coupling"><Row k="Connected volume" v={`${n(latest?.hardwareDiagnostics?.connectedVolumeL,2)} L`}/><Row k="Pipe volume" v={`${n(latest?.hardwareDiagnostics?.pipeVolumeL,3)} L`}/><Row k="Vacuum conductance" v={`${n(latest?.hardwareDiagnostics?.vacuumConductanceM3h,3)} m³/h`}/><Row k="Effective pump" v={`${n(latest?.hardwareDiagnostics?.effectivePumpCapacityM3h,2)} m³/h`}/><Row k="Ultrasonic power density" v={`${n(latest?.ultrasonic?.powerDensityWPerL,3)} W/L`}/><Row k="Ultrasonic status" v={String(latest?.ultrasonic?.status ?? "—")}/></ReportBlock>
      </div>
      <ReportBlock title="6. Cold-Trap / Condensation" className="mt-4"><Row k="Heat removal" v={`${n(latest?.hardwareDiagnostics?.coldTrapHeatLoadKw,4)} kW`}/><Row k="Condensation capacity" v={`${n(latest?.hardwareDiagnostics?.coldTrapCondensationCapacityKgPerSecond,6)} kg/s`}/><Row k="Stage 1–4 collected" v={(latest?.hardwareDiagnostics?.coldTrapStageCondensedWaterKg ?? []).map(v=>n(v,4)).join(" / ") || "—"}/></ReportBlock>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ReportBlock title="7. Safety & Quality"><Row k="Final stage" v={String(latest?.safety?.stage ?? "—")}/><Row k="Systems safe" v={latest?.safety?.allSystemsSafe ? "SAFE" : "CHECK"}/><Row k="Alarm" v={String(latest?.safety?.alarm ?? "None")}/><Row k="Transition reason" v={String(latest?.safety?.transitionReason ?? "—")}/></ReportBlock>
        <ReportBlock title="8. Data Provenance"><Row k="Simulation source" v="ClosedLoopSimulationEngine"/><Row k="Frame source" v="Server causal frames"/><Row k="Simulation data" v="SIMULATED / DERIVED"/><Row k="Laboratory validation" v="Only when laboratory dataset is supplied"/><Row k="Unknown data" v="Remain UNKNOWN / DATA GAP"/></ReportBlock>
      </div>
      <ReportBlock title="9. Causal Timeline" className="mt-4"><div className="max-h-72 overflow-auto print:max-h-none">{frames.map(f=><div key={f.step} className="grid grid-cols-[55px_80px_90px_1fr] gap-2 border-b border-slate-800 py-2 text-xs font-mono"><span>#{f.step}</span><span>{n(f.timestampSeconds,1)}s</span><span>{f.safety?.stage ?? "—"}</span><span>T {n(f.sensorAfter.temperatureC,2)}°C · P {n(f.sensorAfter.pressureMbar,2)}mbar · Y {n(f.sensorAfter.yieldPercent,2)}%</span></div>)}</div></ReportBlock>
      <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-slate-400"><b className="text-yellow-300">Scientific note:</b> this report is generated from the current simulation evidence. It does not convert simulated values into laboratory measurements and does not claim physical validation where no laboratory dataset exists.</div>
    </>}
  </section>;
}

function ReportBlock({title,children,className=""}:{title:string;children:React.ReactNode;className?:string}){return <div className={`rounded-xl border border-slate-800 bg-slate-900/40 p-4 ${className}`}><h3 className="mb-3 text-sm font-semibold tracking-wide text-emerald-300">{title}</h3>{children}</div>}
function Row({k,v}:{k:string;v:string}){return <div className="flex justify-between gap-4 border-b border-slate-800 py-2 text-xs"><span className="text-slate-500">{k}</span><span className="text-right font-mono text-slate-200">{v}</span></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-lg border border-slate-800 bg-slate-950 p-3"><div className="text-[9px] tracking-widest text-slate-500">{label}</div><div className="mt-1 break-all font-mono text-sm text-emerald-300">{value}</div></div>}
