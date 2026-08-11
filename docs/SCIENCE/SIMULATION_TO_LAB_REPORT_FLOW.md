# IUVFES Simulation → Laboratory Evidence Flow

## Purpose

This document defines the boundary between the deterministic Digital Twin and real laboratory evidence.

The simulation may generate predictions, but it cannot promote them to verified results.

## Mandatory report layers

Every simulation-derived scientific report contains:

1. **VERIFIED / OBSERVED** — laboratory/literature evidence supplied to the report. A pure simulation run contributes nothing to this layer.
2. **ESTIMATED / MODEL** — deterministic simulation outputs and model-derived quantities.
3. **AI ANALYSIS** — interpretation, uncertainty, conflicts, hypotheses, and experiment recommendations.
4. **UNKNOWN / KNOWLEDGE GAPS** — parameters that remain unsupported or unmeasured.
5. **NEXT EXPERIMENT** — a concrete laboratory validation/revision path.

## Current integration

`ClosedLoopSimulationEngine.buildScientificReport()` executes the closed-loop model and sends the result through `scientificReportBridge.ts`.

The bridge records the simulation endpoint as estimated/model information and creates a laboratory validation recommendation. It intentionally does not claim that the simulation result is observed or validated.

## Human–AI learning loop

```text
Simulation
   ↓
Prediction
   ↓
Scientific report
   ├── Verified evidence
   ├── Estimated/model output
   ├── AI analysis
   ├── Unknowns
   └── Next laboratory experiment
              ↓
        Physical measurement
              ↓
       Evidence ingestion
              ↓
   Replication / conflict analysis
              ↓
       Knowledge Base update
              ↓
       Model revision / next test
```

## Important boundary

A simulation endpoint is not a laboratory measurement. A detected response peak is not automatically molecular resonance. A literature frequency is not automatically a resonance fingerprint. Unknown remains a valid state until evidence supports a value.

## Sample-context requirement

Laboratory results must retain sample state and context such as fresh/wet/dried/frozen, moisture, geography/altitude, cultivation/fertilizer, biological stage, harvest, storage, drying/freezing history, preparation, particle size, solvent, pressure, temperature, power, frequency, and instrument context where relevant.

Differences in those variables may explain apparently conflicting results and must not be silently merged into one material fingerprint.
