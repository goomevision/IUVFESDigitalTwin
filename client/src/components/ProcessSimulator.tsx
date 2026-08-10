import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ProcessMachine3D } from "@/components/ProcessMachine3D";
import { ProcessEventTimeline } from "@/components/ProcessEventTimeline";
import { ScientificRunRecorder } from "@/components/ScientificRunRecorder";

interface ProcessSimulatorProps { experimentId: string; onExit?: () => void; onComplete?: () => void; }
type Stage = "PRE_FLIGHT" | "CHARGE" | "VACUUM" | "HEAT_UP" | "EXTRACTION" | "CONDENSATION" | "COOL_DOWN" | "COMPLETE" | "FAULT";
interface CausalFrame { step: number; timestampSeconds: number; sensorBefore: any; controller: any; sensorAfter: any; }

const STAGES: Array<{ id: Stage; label: string; description: string }> = [
  { id: "PRE_FLIGHT", label: "PRE-FLIGHT", description: "Checking sensors, chamber seals and process interlocks" },
  { id: "CHARGE", label: "CHARGE", description: "Loading botanical material and verifying mass balance" },
  { id: "VACUUM", label: "VACUUM", description: "Evacuating the chamber toward the target pressure" },
  { id: "HEAT_UP", label: "HEAT-UP", description: "Ramping temperature only after the vacuum interlock passes" },
  { id: "EXTRACTION", label: "EXTRACTION", description: "Driving moisture and volatile compounds from the matrix" },
  { id: "CONDENSATION", label: "CONDENSATION", description: "Recovering vapor and separating condensate streams" },
  { id: "COOL_DOWN", label: "COOL-DOWN", description: "Returning the chamber to a safe handling state" },
  { id: "COMPLETE", label: "COMPLETE", description: "Final mass and energy balance calculated" },
];

function MetricGauge({ label, value, max, unit, icon: Icon, detail }: { label: string; value: number; max: number; unit: string; icon: typeof Wind; detail?: string }) {
  const percent = Math.max(0, Math.min(100, value / Math.max(max, 0.001) * 100));
  return <div className="group rounded-2xl border border-cyan-500/15 bg-slate-950/65 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.03)] transition-colors hover:border-cyan-400/30">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500"><Icon className="h-4 w-4 text-cyan-400" />{label}</div>
      <span className="font-mono text-[10px] text-slate-600">{Math.round(percent)}%</span>
    </div>
    <div className="flex items-end justify-between gap-2">
      <div className="font-mono text-2xl font-bold tracking-tight text-cyan-200">{value.toFixed(1)}</div>
      <div className="pb-1 text-xs text-slate-500">{unit}</div>
    </div>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${percent}%` }} /></div>
    {detail && <div className="mt-2 truncate font-mono text-[10px] text-slate-600">{detail}</div>}
  </div>;
}

function machineLabel(on: boolean, active = "ACTIVE", standby = "OFF") { return on ? active : standby; }
function statusClass(value: string) { return value === "ACTIVE" || value === "PASS" || value === "SAFE" ? "text-emerald-300" : value === "TRIPPED" ? "text-red-300" : "text-cyan-300"; }

export function ProcessSimulator({ experimentId, onExit, onComplete }: ProcessSimulatorProps) {
  const experimentQuery = trpc.experiments.get.useQuery(experimentId);
  const startMutation = trpc.closedLoop.start.useMutation();
  const stepMutation = trpc.closedLoop.step.useMutation();
  const pauseMutation = trpc.closedLoop.pause.useMutation();
  const resumeMutation = trpc.closedLoop.resume.useMutation();
  const stopMutation = trpc.closedLoop.stop.useMutation();
  const statusQuery = trpc.closedLoop.status.useQuery({ experimentId }, { refetchOnWindowFocus: false });
  const [frames, setFrames] = useState<CausalFrame[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [alarm, setAlarm] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const current = frames.at(-1)?.sensorAfter ?? { pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 };
  const machine = frames.at(-1)?.controller;
  const activeStage: Stage = machine?.stage ?? (statusQuery.data?.state?.stage as Stage) ?? "PRE_FLIGHT";
  const stageIndex = STAGES.findIndex(s => s.id === activeStage);
  const timeline = useMemo(() => frames.map(f => ({ ...f.controller, elapsedSeconds: f.timestampSeconds })), [frames]);
  const recentFrames = useMemo(() => frames.slice(Math.max(0, frames.length - 80)), [frames]);

  const stopTimer = () => { if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null; } };

  const stepOnce = async () => {
    try {
      const result = await stepMutation.mutateAsync({ experimentId });
      if (result.frame) setFrames(prev => [...prev, result.frame as CausalFrame]);
      if (result.status === "completed" || result.status === "failed") {
        stopTimer(); setRunning(false); setPaused(false); setCompleted(result.status === "completed");
        if (result.status === "failed") setAlarm(result.state?.alarm ?? "PROCESS FAULT");
        onComplete?.();
      }
    } catch (error) { console.error(error); stopTimer(); setRunning(false); setAlarm("CLOSED-LOOP STEP ERROR — PROCESS PAUSED"); toast.error("Process step failed"); }
  };

  const start = async () => {
    if (!experimentQuery.data || startMutation.isPending) return;
    const p = experimentQuery.data.inputParameters as Record<string, unknown>;
    try {
      const result = await startMutation.mutateAsync({ experimentId, materialWeight: Number(p.materialWeight), waterContent: Number(p.waterContent), oilContent: Number(p.oilContent), targetPressure: Number(p.targetPressure), targetTemperature: Number(p.targetTemperature), dtSeconds: 1, maxSteps: Math.min(100000, Math.max(100, Math.ceil(Number(p.duration || 1) * 3600))) });
      const existingFrames = (result.frames ?? []) as unknown as CausalFrame[];
      setFrames(existingFrames); setAlarm(null); setCompleted(false); setPaused(false); setRunning(true); toast.success("Closed-loop control session started");
    } catch (error) { console.error(error); setAlarm("CLOSED-LOOP START ERROR — PROCESS NOT STARTED"); toast.error("Could not start process"); }
  };

  const pause = async () => { try { await pauseMutation.mutateAsync({ experimentId }); stopTimer(); setPaused(true); setRunning(false); toast.success("Process paused — state persisted"); } catch (error) { console.error(error); toast.error("Pause failed"); } };
  const resume = async () => { try { await resumeMutation.mutateAsync({ experimentId }); setPaused(false); setRunning(true); toast.success("Process resumed from persisted state"); } catch (error) { console.error(error); toast.error("Resume failed"); } };
  const stop = async () => { try { await stopMutation.mutateAsync({ experimentId }); stopTimer(); setRunning(false); setPaused(false); toast.success("Process stopped and state retained"); } catch (error) { console.error(error); toast.error("Stop failed"); } };
  const reset = async () => { if (running || paused) await stop(); stopTimer(); setFrames([]); setRunning(false); setPaused(false); setCompleted(false); setAlarm(null); };

  useEffect(() => { if (!running || paused || timerRef.current !== null) return; timerRef.current = window.setInterval(() => { void stepOnce(); }, 180); return stopTimer; }, [running, paused, experimentId]);
  useEffect(() => () => stopTimer(), []);

  const chartPoints = recentFrames.map((f, i) => `${recentFrames.length <= 1 ? 0 : i / (recentFrames.length - 1) * 100},${100 - Math.min(100, f.sensorAfter.temperatureC / 150 * 100)}`).join(" ");
  const stateAlarm = machine?.alarm ?? alarm;
  const stageProgress = machine?.progress ?? 0;
  const elapsedSeconds = frames.at(-1)?.timestampSeconds ?? 0;
  const sessionStatus = stateAlarm ? "FAULT" : completed ? "COMPLETE" : paused ? "PAUSED" : running ? "RUNNING" : "STANDBY";
  const sessionStatusClass = stateAlarm ? "border-red-500/30 bg-red-500/10 text-red-300" : completed ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : paused ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300" : running ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300" : "border-slate-700 bg-slate-900/70 text-slate-400";
  const headerMetrics = [
    { label: "SESSION", value: sessionStatus, Icon: Activity },
    { label: "ELAPSED", value: `${elapsedSeconds.toFixed(0)} s`, Icon: Clock3 },
    { label: "CAUSAL TRACE", value: `${frames.length} frames`, Icon: Database },
    { label: "SAFETY", value: stateAlarm ? "ATTENTION" : "MONITORED", Icon: ShieldCheck },
  ];

  return <div className="min-h-screen bg-[radial-gradient(circle_at_top,#10263a_0%,#050912_45%,#02040a_100%)] p-3 text-slate-100 md:p-5">
    <div className="mx-auto max-w-[1540px] space-y-4">
      <header className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/75 shadow-2xl shadow-cyan-950/10 backdrop-blur">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] ${sessionStatusClass}`}><span className={`h-1.5 w-1.5 rounded-full ${running ? "animate-pulse bg-cyan-300" : completed ? "bg-emerald-300" : stateAlarm ? "bg-red-300" : paused ? "bg-yellow-300" : "bg-slate-500"}`} />{sessionStatus}</span>
              <span className="font-mono text-[10px] tracking-[0.28em] text-cyan-500">IUVFES // DIGITAL TWIN</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">PROCESS SIMULATION CONTROL ROOM</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500"><span>Experiment {experimentId}</span><span>Persistent closed loop</span><span>Step {frames.length}</span></div>
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-[620px] lg:justify-end">
            <Button onClick={start} disabled={startMutation.isPending || running || paused} className="bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/30 hover:bg-cyan-400"><Play className="mr-2 h-4 w-4" />START</Button>
            {!paused ? <Button onClick={pause} disabled={!running || pauseMutation.isPending} variant="outline" className="border-yellow-500/40 bg-transparent text-yellow-300 hover:bg-yellow-500/10"><Pause className="mr-2 h-4 w-4" />PAUSE</Button> : <Button onClick={resume} disabled={resumeMutation.isPending} variant="outline" className="border-emerald-500/40 bg-transparent text-emerald-300 hover:bg-emerald-500/10"><Play className="mr-2 h-4 w-4" />RESUME</Button>}
            <Button onClick={stop} disabled={!running && !paused} variant="outline" className="border-red-500/30 bg-transparent text-red-300 hover:bg-red-500/10"><Square className="mr-2 h-4 w-4" />STOP</Button>
            <Button onClick={reset} variant="outline" className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"><RotateCcw className="mr-2 h-4 w-4" />RESET</Button>
            <Button onClick={onExit} variant="outline" className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"><Square className="mr-2 h-4 w-4" />EXIT</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t border-slate-800/80 md:grid-cols-4">
          {headerMetrics.map(({ label, value, Icon }) => <div key={label} className="flex items-center gap-3 border-r border-slate-800/70 px-4 py-3 last:border-r-0"><Icon className="h-4 w-4 text-slate-500" /><div><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">{label}</div><div className={`mt-0.5 font-mono text-xs ${label === "SAFETY" && stateAlarm ? "text-red-300" : "text-slate-300"}`}>{value}</div></div></div>)}
        </div>
      </header>

      <section className="rounded-3xl border border-cyan-500/15 bg-slate-950/60 p-4 md:p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Closed-loop sequence</p><h2 className={`mt-1 text-xl font-semibold ${activeStage === "FAULT" ? "text-red-300" : "text-cyan-200"}`}>{STAGES.find(s => s.id === activeStage)?.label ?? activeStage}</h2></div>
          <div className="min-w-[210px] md:text-right"><div className="mb-1 flex justify-between font-mono text-[10px] text-slate-500"><span>PROCESS PROGRESS</span><span>{Math.round(stageProgress * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full transition-all duration-500 ${activeStage === "FAULT" ? "bg-red-400" : "bg-cyan-400"}`} style={{ width: `${Math.max(0, Math.min(100, stageProgress * 100))}%` }} /></div></div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          {STAGES.map((item, index) => <div key={item.id} className={`relative rounded-xl border p-3 transition-all ${index === stageIndex ? "border-cyan-400/60 bg-cyan-400/10 shadow-lg shadow-cyan-950/20" : index < stageIndex ? "border-emerald-500/25 bg-emerald-500/5" : "border-slate-800 bg-slate-900/35"}`}><div className="mb-2 flex items-center justify-between">{index < stageIndex ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : index === stageIndex ? <CircleGauge className="h-4 w-4 animate-pulse text-cyan-400" /> : <div className="h-4 w-4 rounded-full border border-slate-700" />}<span className="font-mono text-[9px] text-slate-600">0{index + 1}</span></div><div className="text-[10px] font-semibold tracking-[0.12em] text-slate-300">{item.label}</div></div>)}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"><Gauge className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" /><p className="text-sm leading-6 text-slate-400">{machine?.transitionReason ?? STAGES[stageIndex]?.description}</p></div>
      </section>

      {stateAlarm && <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 shadow-lg shadow-red-950/10"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><div className="font-semibold tracking-wide">PROCESS ATTENTION</div><div className="mt-1 text-sm text-red-300/80">{stateAlarm}</div></div></div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricGauge label="CHAMBER PRESSURE" value={current.pressureMbar} max={1013.25} unit="mbar" icon={Wind} detail="Vacuum chamber sensor" />
        <MetricGauge label="PROCESS TEMPERATURE" value={current.temperatureC} max={150} unit="°C" icon={Thermometer} detail="Thermal process sensor" />
        <MetricGauge label="RECOVERY YIELD" value={current.yieldPercent} max={100} unit="%" icon={CircleGauge} detail={`${current.oilRecoveredKg.toFixed(3)} kg oil recovered`} />
        <MetricGauge label="ENERGY LOAD" value={current.energyKwh} max={10} unit="kWh" icon={Zap} detail="Accumulated process energy" />
      </div>

      <ProcessMachine3D machine={machine} />

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <section className="rounded-3xl border border-cyan-500/15 bg-slate-950/60 p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Live telemetry</p><h3 className="mt-1 font-semibold tracking-wider text-cyan-200">PROCESS TREND</h3></div><div className="flex items-center gap-3 font-mono text-[10px] text-slate-500"><span>T+ {elapsedSeconds.toFixed(0)}s</span><span>{recentFrames.length} samples</span></div></div>
          <div className="relative h-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,211,238,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,.25) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            {chartPoints ? <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full p-5"><polyline points={chartPoints} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg> : <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Activity className="mx-auto h-8 w-8 text-slate-700" /><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">Waiting for telemetry</p></div></div>}
            <div className="absolute left-4 top-4 rounded-lg border border-slate-800 bg-slate-950/80 px-2 py-1 font-mono text-[9px] text-cyan-500">TEMPERATURE PROFILE</div>
            <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 px-2 py-1 font-mono text-[9px] text-slate-600">0–150 °C SCALE</div>
          </div>
        </section>

        <section className="rounded-3xl border border-cyan-500/15 bg-slate-950/60 p-4 md:p-5"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Actuator layer</p><h3 className="mt-1 font-semibold tracking-wider text-cyan-200">MACHINE STATE</h3></div><span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[9px] text-slate-500">REAL-TIME</span></div><div className="space-y-2 font-mono text-xs">{[["VACUUM PUMP", machineLabel(machine?.commands.vacuumPump ?? false)],["HEATER", machineLabel(machine?.commands.heater ?? false)],["EXTRACTOR", machineLabel(machine?.commands.extractor ?? false)],["CONDENSER", machineLabel(machine?.commands.condenser ?? false)],["COOLING", machineLabel(machine?.commands.cooling ?? false)],["VACUUM INTERLOCK", machine?.interlocks.vacuumAchieved ? "PASS" : "WAITING"],["THERMAL INTERLOCK", machine?.interlocks.overTemperature ? "TRIPPED" : "SAFE"],["MASS BALANCE", `${current.oilRecoveredKg.toFixed(3)} kg oil / ${current.waterRemovedKg.toFixed(3)} kg water`]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-2.5"><span className="truncate text-slate-500">{label}</span><span className={`shrink-0 ${statusClass(value as string)}`}>{value}</span></div>)}</div></section>
      </div>

      <ProcessEventTimeline timeline={timeline} />
      <ScientificRunRecorder experimentId={experimentId} frames={frames} completed={completed} />

      <section className="rounded-3xl border border-cyan-500/15 bg-slate-950/60 p-4 md:p-5"><div className="mb-4 flex items-center gap-2"><Database className="h-4 w-4 text-cyan-500" /><div><p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Run summary</p><h3 className="mt-1 font-semibold tracking-wider text-cyan-200">SCIENTIFIC OUTPUT</h3></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["OIL RECOVERED", `${current.oilRecoveredKg.toFixed(3)} kg`, "text-amber-300"],["WATER REMOVED", `${current.waterRemovedKg.toFixed(3)} kg`, "text-blue-300"],["PROCESS TIME", `${elapsedSeconds.toFixed(0)} s`, "text-emerald-300"],["CAUSAL FRAMES", `${frames.length || "READY"}`, "text-cyan-300"]].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4"><div className="text-[10px] uppercase tracking-[0.16em] text-slate-600">{label}</div><div className={`mt-2 font-mono text-xl font-semibold ${color}`}>{value}</div></div>)}</div></section>
    </div>
  </div>;
}
