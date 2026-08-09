import React, { useMemo, useState } from 'react';
import type { ExperimentNotebook as ExperimentNotebookModel, ExperimentStartRequest } from '@shared/experimentNotebook';

export interface ExperimentNotebookProps {
  initial?: Partial<ExperimentStartRequest>;
  onStart?: (request: ExperimentStartRequest) => void;
  onSaveNote?: (experimentId: string, note: string) => void;
}

export function ExperimentNotebook({ initial, onStart, onSaveNote }: ExperimentNotebookProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [researcherId, setResearcherId] = useState(initial?.researcherId ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [hypothesis, setHypothesis] = useState(initial?.hypothesis ?? '');
  const [materialId, setMaterialId] = useState(initial?.material?.materialId ?? '');
  const [sampleId, setSampleId] = useState(initial?.material?.sampleId ?? '');
  const [massKg, setMassKg] = useState(String(initial?.material?.massKg ?? ''));
  const [procedure, setProcedure] = useState((initial?.procedure ?? []).join('\n'));
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<ExperimentNotebookModel['notes']>([]);

  const request = useMemo<ExperimentStartRequest>(() => ({
    title, researcherId, objective, hypothesis: hypothesis || undefined,
    material: { materialId, sampleId, massKg: Number(massKg) },
    equipment: initial?.equipment ?? [], environment: initial?.environment,
    procedure: procedure.split('\n').map(v => v.trim()).filter(Boolean),
    inputParameters: initial?.inputParameters ?? {},
  }), [title, researcherId, objective, hypothesis, materialId, sampleId, massKg, procedure, initial]);

  const canStart = Boolean(title && researcherId && objective && materialId && sampleId && Number(massKg) > 0 && request.procedure.length);

  const saveNote = () => {
    if (!note.trim()) return;
    const entry = { timestamp: new Date().toISOString(), authorId: researcherId || 'OPERATOR', text: note.trim() };
    setSavedNotes(current => [...current, entry]);
    setNote('');
    // The parent can persist this through the notebook API/store.
    onSaveNote?.('pending-experiment', entry.text);
  };

  return <section className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-5 text-slate-100 shadow-xl">
    <header className="mb-5 flex items-center justify-between">
      <div><p className="text-xs tracking-[0.3em] text-cyan-400">IUVFES RESEARCH</p><h2 className="text-2xl font-semibold">Digital Laboratory Notebook</h2></div>
      <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-300">TRACEABLE EXPERIMENT</span>
    </header>

    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm">Experiment title<input className="mt-1 w-full rounded bg-slate-900 p-2" value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="text-sm">Researcher / ORCID<input className="mt-1 w-full rounded bg-slate-900 p-2" value={researcherId} onChange={e => setResearcherId(e.target.value)} /></label>
      <label className="text-sm md:col-span-2">Objective<textarea className="mt-1 w-full rounded bg-slate-900 p-2" value={objective} onChange={e => setObjective(e.target.value)} /></label>
      <label className="text-sm md:col-span-2">Hypothesis<textarea className="mt-1 w-full rounded bg-slate-900 p-2" value={hypothesis} onChange={e => setHypothesis(e.target.value)} /></label>
      <label className="text-sm">Material ID<input className="mt-1 w-full rounded bg-slate-900 p-2" value={materialId} onChange={e => setMaterialId(e.target.value)} /></label>
      <label className="text-sm">Sample ID<input className="mt-1 w-full rounded bg-slate-900 p-2" value={sampleId} onChange={e => setSampleId(e.target.value)} /></label>
      <label className="text-sm">Mass (kg)<input type="number" min="0" className="mt-1 w-full rounded bg-slate-900 p-2" value={massKg} onChange={e => setMassKg(e.target.value)} /></label>
      <label className="text-sm">Procedure (one step per line)<textarea className="mt-1 min-h-28 w-full rounded bg-slate-900 p-2" value={procedure} onChange={e => setProcedure(e.target.value)} /></label>
    </div>

    <div className="mt-6 rounded-lg border border-slate-700 p-4">
      <h3 className="font-medium">Operator observation / note</h3>
      <div className="mt-2 flex gap-2"><input className="min-w-0 flex-1 rounded bg-slate-900 p-2" placeholder="Record what happened; do not overwrite sensor data." value={note} onChange={e => setNote(e.target.value)} /><button className="rounded bg-slate-700 px-4 py-2" onClick={saveNote}>Record</button></div>
      {savedNotes.length > 0 && <ul className="mt-3 space-y-1 text-sm text-slate-300">{savedNotes.map((n, i) => <li key={`${n.timestamp}-${i}`}>[{new Date(n.timestamp).toLocaleTimeString()}] {n.text}</li>)}</ul>}
    </div>

    <footer className="mt-6 flex items-center justify-between gap-3"><p className="text-xs text-slate-400">Raw observations remain separate from derived analysis and simulation data.</p><button disabled={!canStart} className="rounded bg-cyan-500 px-5 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => onStart?.(request)}>Create Experiment</button></footer>
  </section>;
}
