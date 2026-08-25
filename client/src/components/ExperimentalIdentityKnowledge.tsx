import type { LiteracyMode } from "@/lib/scientificKnowledge";

const explanations: Record<LiteracyMode, { lead: string; cards: readonly [string, string][] }> = {
  SIMPLE: {
    lead: "Identity explains which records belong together. Integrity explains whether evidence has changed. Neither turns a simulation into a laboratory result.",
    cards: [
      ["Experimental Identity", "A label map for experiment, sample, instrument, dataset, and evidence. Missing labels stay NOT LOADED."],
      ["Evidence Integrity", "A future check that evidence content has not changed. No evidence is loaded now, so there is no integrity result."],
      ["Why Identity Matters", "Without matching identity, two values must not be treated as the same experiment or sample."],
    ],
  },
  SCIENTIFIC: {
    lead: "An auditable chain connects experiment, sample, simulation run, measurement, instrument, calibration, dataset, provenance, and evidence only when canonical records are legitimately available.",
    cards: [
      ["Dataset Identity", "A dataset identifier, origin, provenance reference, and content hash are required before dataset integrity can be discussed."],
      ["Provenance", "Provenance documents source and relationship context. It is not measurement proof, calibration proof, or validation by itself."],
      ["Integrity vs Validation", "Integrity asks whether an evidence payload is unchanged; validation asks a separate scientific question. Neither is implied by comparison alone."],
    ],
  },
  EXPERT: {
    lead: "P22 references existing canonical schema and server contracts: research experiment identity, experiment-instrument/calibration links, dataset manifests, provenance records, SHA-256 dataset/event hashing, and the immutable scientific event-hash journal.",
    cards: [
      ["Hash Verification", "Use an authorized server-side SHA-256 provider only with loaded evidence content and a canonical source reference. P22 does not calculate a hash for empty state."],
      ["Verification Gate", "READY FOR VERIFICATION is not VERIFIED. Verified requires real linked identifiers, evidence payload, hash reference, provenance, and authorized verification."],
      ["Authority Boundary", "Identity links are metadata only. They must not alter CausalFrame.timestampSeconds, sensorAfter, effectiveCommands, actuatorLevels, engine state, or laboratory classification."],
    ],
  },
};

export function ExperimentalIdentityKnowledge({ mode }: { mode: LiteracyMode }) {
  const content = explanations[mode];
  return <section id="identity-integrity" className="border border-indigo-500/25 bg-indigo-500/[0.035] p-4 md:p-6"><div className="font-mono text-[10px] tracking-[0.18em] text-indigo-300">P22 // EXPERIMENTAL IDENTITY & EVIDENCE INTEGRITY</div><h2 className="mt-2 text-xl font-semibold tracking-[0.06em] text-slate-100">Identity, integrity, and auditability without invented evidence</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{content.lead}</p><div className="mt-4 grid gap-3 md:grid-cols-3">{content.cards.map(([label, description]) => <article key={label} className="border border-indigo-500/15 bg-slate-950/80 p-3"><h3 className="font-mono text-[10px] tracking-[0.13em] text-indigo-200">{label}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{description}</p></article>)}</div><p className="mt-4 border-t border-indigo-500/15 pt-3 font-mono text-[9px] leading-relaxed tracking-[0.08em] text-slate-500">SOURCE / PROVENANCE: P22 source audit — schema identity/evidence tables, scientific dataset and event-journal SHA-256 mechanisms, P17–P21 contracts. SIMULATION ≠ MEASURED. READY FOR VERIFICATION ≠ VERIFIED. INTEGRITY ≠ VALIDATION.</p></section>;
}
