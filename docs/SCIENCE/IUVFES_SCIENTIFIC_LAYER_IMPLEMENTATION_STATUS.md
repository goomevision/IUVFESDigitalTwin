# IUVFES Scientific Layer — Implementation Status

**Branch:** `feature/scientific-data-model-v2`

## Implemented

1. `shared/scientific.ts` remains the base scientific contract.
2. `shared/scientific-v2.ts` adds evidence profiles, sample lineage, experiment signatures, conflict records, negative evidence, hypothesis state, AI decision ledger and knowledge aggregation.
3. `server/science/evidenceEngine.ts` adds pure logic for experiment similarity, evidence profiling, aggregation, conflict detection and negative-evidence creation.
4. `server/science/db.ts` adds persistence functions for samples, scientific experiments, frequency sweeps, peaks, knowledge gaps, conflicts, negative evidence, lineage, recommendations and AI decisions.
5. `server/science/reportContract.ts` enforces the report separation:
   - VERIFIED / OBSERVED
   - ESTIMATED / MODEL
   - AI ANALYSIS
   - UNKNOWN / KNOWLEDGE GAPS
   - NEXT EXPERIMENT
6. `drizzle/schema.ts` has been extended additively with persistent scientific tables.

## Scientific behavior

- A literature extraction frequency remains a reported experimental condition, not `f0`.
- A simulation peak remains a model output.
- A laboratory frequency response begins as `OBSERVED_PEAK`.
- `POSSIBLE_RESONANCE` is a separate interpretation and requires evidence.
- Unknown values are not replaced by defaults silently.
- Repeated experiments are retained individually.
- Similar experiments are classified as exact, near, or novel rather than simply discarded.
- Independent replication, new sample context, calibration and conflict resolution remain valid reasons to repeat an apparently similar experiment.
- Negative results are retained as evidence.
- Conflicts are preserved and can become new knowledge gaps.
- AI recommendations are logged so prediction accuracy and information gain can be evaluated later.

## Sample context

The persistent sample model captures the variables needed to distinguish materially different specimens, including sample state, moisture, geography, altitude, cultivation, biological state, post-harvest treatment and preparation.

This prevents the system from treating two samples of the same species as automatically equivalent.

## Database safety

The schema changes are additive. Existing `materials`, `experiments`, `simulationResults`, `controlLogs`, and `reports` remain present.

The repository script `db:push` is responsible for generating and applying the Drizzle migration. **This implementation step does not execute a production database migration automatically.** Database application should occur only after the generated migration is reviewed against the target database.

## Next integration boundary

The next safe step is to connect the existing closed-loop simulation and report UI to these contracts without rewriting the simulation runtime. The simulator should emit `SIMULATION` evidence, while laboratory import should emit `LABORATORY` evidence with sample, instrument, operator and provenance.

The scientific layer must remain a wrapper around the existing runtime, not a replacement for it.
