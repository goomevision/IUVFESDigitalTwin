import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReplayEvidenceFrame } from "@/components/ReplayEvidence";

type ReportMeta = { title?: string; researcherId?: string; objective?: string; hypothesis?: string; procedure?: string[]; inputParameters?: Record<string, unknown> };

type Props = { experimentId: string; sessionId: string | null; frames: ReadonlyArray<ReplayEvidenceFrame>; metadata?: ReportMeta; };

const n = (v: unknown, d = 3) => typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—";
const str = (v: unknown) => typeof v === "string" && v.trim() ? v : "—";

function markdownReport(meta: ReportMeta, experimentId: string, sessionId: string | null, frames: ReadonlyArray<ReplayEvidenceFrame>) {
  const first = frames[0]; const last = frames[frames.length - 1];
  const s = (last?.sensorAfter ?? {}) as Record<string, unknown>;
  const alarms = frames.filter(f => Boolean((f.safety as Record<string, unknown> | undefined)?.alarm));
  const stages = Array.from(new Set(frames.map(f => str((f.safety as Record<string, unknown> | undefined)?.stage))));
  return `# IUVFES Scientific Report — Simulation Evidence Draft\n\n## 1. Metadata\n- Experiment ID: ${experimentId}\n- Session ID: ${sessionId ?? "—"}\n- Title: ${str(meta.title)}\n- Researcher / ORCID: ${str(meta.researcherId)}\n- Evidence type: SIMULATION_REPLAY\n- Validation status: NOT_LAB_VALIDATED\n\n## 2. Objective\n${str(meta.objective)}\n\n## 3. Hypothesis\n${str(meta.hypothesis)}\n\n## 4. Procedure\n${(meta.procedure ?? []).length ? meta.procedure!.map((x, i) => `${i + 1}. ${x}`).join("\\n") : "Procedure not supplied in the source experiment record."}\n\n## 5. Process Evidence\n- Captured frames: ${frames.length}\n- Frame range: ${first?.step ?? "—"}–${last?.step ?? "—"}\n- Time range: ${first ? n(first.timestampSeconds, 1) : "—"}–${last ? n(last.timestampSeconds, 1) : "—"} s\n- Stages observed: ${stages.join(", ") || "—"}\n- Final temperature: ${n(s.temperatureC, 3)} °C\n- Final pressure: ${n(s.pressureMbar, 3)} mbar\n- Final yield: ${n(s.yieldPercent, 3)} %\n- Oil recovered: ${n(s.oilRecoveredKg, 6)} kg\n- Water removed: ${n(s.waterRemovedKg, 6)} kg\n- Energy: ${n(s.energyKwh, 6)} kWh\n- Alarm frames: ${alarms.length}\n\n## 6. Mass / Energy Balance\nThe report records the material and energy fields emitted by the causal frames. It does not infer unrecorded quantities or close a balance using assumptions. Where a required quantity is absent, the report marks it as unavailable.\n\n## 7. Anomalies and Safety\n${alarms.length ? alarms.map(f => `- Frame ${f.step} at T+${n(f.timestampSeconds, 1)} s: ${str((f.safety as Record<string, unknown> | undefined)?.alarm)}`).join("\\n") : "No alarm field was present in the captured frames."}\n\n## 8. Result Statement\nThe captured run is reported as simulation-derived evidence only. No laboratory observation, calibration result, PASS/FAIL validation verdict, or engineering certification is inferred by this report.\n\n## 9. Provenance and Integrity\n- Source: IUVFES Digital Twin closed-loop replay frames\n- Source experiment: ${experimentId}\n- Source session: ${sessionId ?? "—"}\n- Frame identity and timestamps are retained in the Replay → Evidence package.\n- Integrity package: IUVFES-REPLAY-EVIDENCE-1 with SHA-256 canonical payload checksum.\n\n## 10. Scientific Boundary\nThis document is a scientific-report draft derived from simulation replay. Calibration and validation against measured laboratory data remain required before scientific or engineering claims.\n`;
}

export function ScientificReport({ experimentId, sessionId, frames, metadata = {} }: Props) {
  const [generated, setGenerated] = useState(false);
  const report = useMemo(() => markdownReport(metadata, experimentId, sessionId, frames), [metadata, experimentId, sessionId, frames]);
  const download = () => { const blob = new Blob([report], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `iuvfes-scientific-report-${experimentId}.md`; a.click(); URL.revokeObjectURL(url); };
  return <section className="rounded-2xl border border-violet-500/20 bg-slate-950/75 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[9px] tracking-[0.25em] text-slate-500">EVIDENCE → REPORT</div><h3 className="font-semibold tracking-wider text-violet-300">SCIENTIFIC REPORT DRAFT</h3></div><Button variant="outline" disabled={!frames.length} onClick={() => { setGenerated(true); download(); }}><Download className="mr-2 h-4 w-4"/>EXPORT MARKDOWN</Button></div>
    {!frames.length ? <div className="mt-4 rounded-xl border border-dashed border-slate-800 p-6 text-center font-mono text-xs text-slate-600">WAITING FOR EVIDENCE FRAMES</div> : <>
      <div className="mt-4 grid gap-3 md:grid-cols-4"><div className="rounded-lg border border-slate-800 p-3"><div className="text-[8px] text-slate-600">FRAMES</div><div className="font-mono text-lg text-cyan-300">{frames.length}</div></div><div className="rounded-lg border border-slate-800 p-3"><div className="text-[8px] text-slate-600">FINAL TEMP</div><div className="font-mono text-lg text-cyan-300">{n((frames.at(-1)?.sensorAfter as Record<string, unknown> | undefined)?.temperatureC, 2)} °C</div></div><div className="rounded-lg border border-slate-800 p-3"><div className="text-[8px] text-slate-600">OIL RECOVERED</div><div className="font-mono text-lg text-amber-300">{n((frames.at(-1)?.sensorAfter as Record<string, unknown> | undefined)?.oilRecoveredKg, 4)} kg</div></div><div className="rounded-lg border border-slate-800 p-3"><div className="text-[8px] text-slate-600">STATUS</div><div className="font-mono text-sm text-emerald-300">SIMULATION-DERIVED</div></div></div>
      <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-[10px] leading-relaxed text-slate-400">{report}</pre>
      {generated && <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-emerald-300"><FileText className="h-3.5 w-3.5"/>REPORT DRAFT GENERATED — LAB VALIDATION STILL REQUIRED</div>}
    </>}
  </section>;
}
