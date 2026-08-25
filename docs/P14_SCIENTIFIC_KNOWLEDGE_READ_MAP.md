# P14 Scientific Knowledge & Method Center — Read Map

## Purpose

This map identifies the source-of-truth files used to build the P14 education and interpretation layer. P14 may explain existing contracts, but it must not create scientific state, elevate evidence status, or substitute documentation for laboratory validation.

| Source | Why it was read | P14 relationship |
|---|---|---|
| `docs/BUKU_BESAR_IUVFES_DIGITAL_TWIN.md` | Defines the scientific baseline, causal chain, CausalFrame role, session lifecycle, and simulation/laboratory boundary. | Overview, Digital Twin, CausalFrame, Scientific Status, and limitations. |
| `docs/CONTROL_ROOM_NEXT_WORK_ORDER.md` | Defines non-overlap rules, three-result interpretation classes, material context, replay evidence, and staged-work boundaries. | Methods, status labels, knowledge-gap explanation, and P10/P13 protection. |
| `docs/PROCESS_SIMULATOR_DATA_FLOW.md` | Freezes the visual data contract and field-to-UI mapping. | Why-this-value, frame provenance, Digital Twin, CausalFrame, and animation limitations. |
| `client/src/App.tsx` | Defines the current route boundary and GitHub Pages base path. | Adds a public `/knowledge` route without altering Control Room behavior. |
| `client/src/index.css` | Defines the shared dark/cyan visual language, typography, semantic color tokens, and accessibility-relevant focus colors. | P14 must reuse the existing design system. |
| `client/src/pages/ScientificExperimentFlow.tsx` | Shows that experiment intake and ProcessSimulator are behind the P13 authentication gate. | Knowledge Center stays available without creating or opening an experiment/session. |
| `client/src/components/ScientificExperimentIntake.tsx` | Defines current material/context fields and explicit `UNKNOWN`, `USER INPUT`, `LABORATORY`, and provenance wording. | Material Knowledge and Experiment Guide only list currently captured fields and label unavailable fields. |
| `client/src/components/ScientificRunRecorder.tsx` | Defines existing simulation manifest, report, provenance disclaimer, and missing-data wording. | Evidence and Provenance explanations. |
| `client/src/components/ProcessSimulator.tsx` | Exposes existing runtime session/frame context and engine-backed instrument vocabulary. | Runtime-safe Why-this-value affordance; no new engine state. |
| `client/src/components/ProcessMachine3D.tsx` | Already uses CausalFrame-driven visual state. | P14 does not modify this component. |
| `server/closedLoopRouter.ts`, `server/closedLoopSimulation.ts`, `server/scientificEventJournal.ts` | Existing authoritative session, CausalFrame, and scientific evidence boundaries. | Referenced through existing documentation only; no P14 contract change. |

## Findings

The current application supports explanatory content for simulation, CausalFrame, provenance, material context, experiment intake, replay, and evidence. It does not expose a dedicated user-facing AI-analysis contract in the audited implementation. Therefore P14 must describe AI analysis as a bounded interpretive capability and label current runtime AI-analysis availability as `NOT AVAILABLE`.

The current intake captures material identity, origin, batch, harvest date, particle size, pre-treatment, mass, water content, oil content, operator/research metadata, and baseline process targets. Variety, plant part, fresh/dry/frozen state, drying/freezing history, altitude, cultivation/fertilizer/treatment, storage, solvent, and a full extraction protocol are not confirmed by the current intake contract and must be shown as `NOT AVAILABLE` rather than inferred.

## P14 Scope Boundary

P14 is a public knowledge/documentation route and a presentation-only explanation affordance. It must not alter OAuth, experiment/session creation, database/schema, `ClosedLoopSimulationEngine`, CausalFrame, physics, replay/evidence, `ProcessMachine3D`, or P10 acceptance status.
