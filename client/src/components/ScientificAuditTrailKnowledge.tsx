import type { LiteracyMode } from "@/lib/scientificKnowledge";

const explanations: Record<LiteracyMode, { lead: string; cards: readonly [string, string][] }> = {
  SIMPLE: {
    lead: "A scientific audit trail explains what records are needed to understand how an experiment was run. A replay view alone is not enough to reproduce an experiment scientifically.",
    cards: [
      ["Scientific Audit Trail", "A map from experiment through configuration, simulation, frames, evidence, and integrity. Missing links remain NOT LOADED."],
      ["Scientific Reconstruction", "A future way to read linked records again. It does not invent the missing records."],
      ["Why Reproducibility Matters", "Results can only be reviewed when identity, sources, evidence, and limits are clear."],
    ],
  },
  SCIENTIFIC: {
    lead: "Reproducibility requires compatible identity, configuration, material, instruments, calibration, traceability, uncertainty, simulation/frame history, operator action, laboratory data, datasets, provenance, comparison, and integrity references.",
    cards: [
      ["Evidence Chain", "Evidence must keep its source reference, dataset relationship, provenance, integrity status, and interpretation limit."],
      ["Event Chain", "Canonical event hashes can link legitimate events in order. P23 does not append an event to fill an empty chain."],
      ["Replay vs Reconstruction", "Replay reads available CausalFrame history. Reconstruction requires broader records and does not turn visual playback into validation."],
    ],
  },
  EXPERT: {
    lead: "P23 reuses the scientific event journal hash chain, closed-loop session/frame accessors, Control Room observability vocabulary, P22 identity/integrity contracts, and existing replay reader as distinct mechanisms with distinct limits.",
    cards: [
      ["Integrity", "SHA-256 and event-hash references support payload/event integrity when canonical records are available; integrity is not laboratory validation."],
      ["Reproducibility Readiness", "READY FOR REPLAY and REPRODUCIBLE require actual canonical references. A complete-looking UI contract is insufficient."],
      ["Authority Boundary", "Audit metadata must not modify CausalFrame.timestampSeconds, sensorAfter, effectiveCommands, actuatorLevels, physics, PID, safety, or ProcessMachine3D."],
    ],
  },
};

export function ScientificAuditTrailKnowledge({ mode }: { mode: LiteracyMode }) {
  const content = explanations[mode];
  return <section id="audit-trail" className="border border-orange-500/25 bg-orange-500/[0.035] p-4 md:p-6"><div className="font-mono text-[10px] tracking-[0.18em] text-orange-300">P23 // SCIENTIFIC AUDIT TRAIL & REPRODUCIBILITY</div><h2 className="mt-2 text-xl font-semibold tracking-[0.06em] text-slate-100">Reconstruct records without reconstructing facts</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{content.lead}</p><div className="mt-4 grid gap-3 md:grid-cols-3">{content.cards.map(([label, description]) => <article key={label} className="border border-orange-500/15 bg-slate-950/80 p-3"><h3 className="font-mono text-[10px] tracking-[0.13em] text-orange-200">{label}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p></article>)}</div><p className="mt-4 border-t border-orange-500/15 pt-3 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-slate-500">SOURCE / PROVENANCE: P23 source audit — scientific event journal, canonical session/frame history, Control Room observability, P22 identity/integrity, and P17–P21 contracts. REPLAY VISUAL ≠ SCIENTIFIC REPRODUCIBILITY. COMPARISON ≠ VALIDATION.</p></section>;
}
