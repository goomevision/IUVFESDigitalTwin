# IUVFES CONTROL ROOM — NEXT WORK ORDER

> Living execution order for the next staged UI work. This file is an execution addendum to the Buku Besar and `IUVFES_CONTROL_ROOM_STAGED_UI_WORK_MAP.md`.
>
> Repository: `goomevision/IUVFESDigitalTwin`
> Branch: `feature/control-room-ui`
> Date: 2026-08-12
>
> ## 1. CURRENT POSITION
>
> The Control Room already has the principal visual components and is bound to engine/CausalFrame data. The next work must **not** be a redesign from zero. It is a controlled refinement sequence.
>
> Current priority: **P0 — baseline/data-contract closure**, followed by P1/P2 visual system and shell refinement.
>
> ## 2. NON-OVERLAP RULE
>
> Only one implementation phase may be active at a time.
>
> - Do not alter physics merely to improve appearance.
> - Do not invent telemetry, scientific values, or fallback frames.
> - Do not replace existing CausalFrame contracts with local UI contracts.
> - Do not mix responsive redesign with engine fixes.
> - Every phase ends with a checkpoint commit and validation before the next phase starts.
>
> ## 3. EXECUTION PHASES
>
> ### P0 — Baseline closure
> **Goal:** establish a clean, reproducible starting point.
>
> Tasks:
> - verify repository/branch checkpoint;
> - verify `ProcessSimulator`, `ProcessMachine3D`, trend, timeline, causal inspector, recorder and replay data flow;
> - resolve or explicitly quarantine snapshot/restore determinism issues;
> - verify session persistence boundary;
> - record all unresolved gaps without fabricating data.
>
> Gate: every displayed scientific/engineering value has an identifiable source; replay determinism status is known.
>
> ### P1 — Visual design system
> **Goal:** make the interface visually coherent before moving individual panels.
>
> Tasks:
> - one spacing scale;
> - one typography hierarchy;
> - one panel/card language;
> - one status vocabulary;
> - one provenance vocabulary;
> - one hierarchy: machine → instruments → science/evidence.
>
> Gate: no major component defines an unrelated visual language.
>
> ### P2 — Master shell/grid
> **Goal:** eliminate overlap and establish stable zones.
>
> Layout contract:
> - system header;
> - operator rail;
> - central process-machine hero;
> - right status/safety/hardware rail;
> - instrument strip;
> - trend/analytics zone;
> - causal/event/recorder zone.
>
> Gate: desktop layouts remain stable at 1920×1080 and 1440×900 with no horizontal overflow or overlapping panels.
>
> ### P3 — Operator/navigation hierarchy
> **Goal:** make operation immediately understandable.
>
> Tasks:
> - session/experiment identity;
> - RUN/PAUSE/RESUME/STOP/RESET hierarchy;
> - safety/interlock visibility;
> - navigation to Process, Trend, Causal Trace, Material, Experiment, Evidence, Report and Diagnostics.
>
> Gate: operator can identify machine status, safety status and primary control without hunting through the UI.
>
> ### P4 — Machine visual refinement
> **Goal:** refine existing 3D process visualization without changing its scientific contract.
>
> Tasks:
> - improve spatial hierarchy and labels;
> - improve readability of reactor → ultrasonic → vapor/flow → cold traps → vacuum chain;
> - preserve frame-driven animation;
> - preserve safe Three.js lifecycle.
>
> Gate: visual state changes are traceable to engine state.
>
> ### P5 — Instrument and analytics refinement
> **Goal:** make measurements readable and comparable.
>
> Tasks:
> - temperature;
> - pressure;
> - yield/output when available;
> - recovered oil/water/energy when available;
> - ultrasonic frequency/power when available;
> - synchronized trends and frame cursor.
>
> Gate: every displayed number has frame/step provenance and unknown values remain UNKNOWN.
>
> ### P6 — Scientific interpretation layer
> **Goal:** present the three required result classes without mixing them.
>
> Every final report/output must expose three clearly separated blocks:
>
> 1. **RESULT A — TESTED / EVIDENCED**: supported by validated laboratory or accepted evidence; never presented from hypothesis alone.
> 2. **RESULT B — ESTIMATED / POSSIBLE**: derived from literature, model fit, simulation, incomplete evidence or hypothesis; uncertainty/confidence must be visible.
> 3. **RESULT C — AI ANALYSIS**: AI interpretation, pattern detection, contradictions, gaps and recommended next laboratory tests; never silently promoted to fact.
>
> Gate: users can distinguish what is known, what is probable, and what AI recommends.
>
> ### P7 — Laboratory feedback loop
> **Goal:** close the human ↔ AI discovery loop.
>
> Tasks:
> - laboratory test recommendation;
> - sample identity/context capture;
> - test result ingestion;
> - comparison against previous runs;
> - strengthening/weakening of evidence;
> - detection of genuinely new observations;
> - prevent unnecessary repetition of already well-supported tests.
>
> Gate: every laboratory result can strengthen, weaken, contradict or extend an existing knowledge item with provenance.
>
> ### P8 — Context-aware material knowledge
> **Goal:** prevent sample condition from being hidden inside a generic material name.
>
> Capture where available:
> - species/variety;
> - plant part;
> - fresh/dry/frozen state;
> - moisture;
> - drying/freezing history;
> - origin/region;
> - altitude;
> - cultivation conditions;
> - fertilizer/treatment;
> - harvest age/time;
> - batch/lot;
> - particle size;
> - storage conditions;
> - solvent and extraction protocol.
>
> Gate: results from materially different samples are not incorrectly merged as if they were identical.
>
> ### P9 — Replay/evidence integrity
> **Goal:** make scientific evidence reproducible.
>
> Tasks:
> - valid CausalFrame only;
> - deterministic replay;
> - immutable evidence payload;
> - provenance;
> - canonical serialization/checksum;
> - explicit SIMULATION/LITERATURE/LABORATORY/DERIVED/HYPOTHESIS boundaries.
>
> Gate: the same frame range produces the same canonical evidence payload.
>
> ### P10 — Responsive and visual QA
> **Goal:** make the same scientific hierarchy usable across screens.
>
> Targets:
> - 1920×1080;
> - 1440×900;
> - laptop;
> - tablet;
> - mobile.
>
> Gate: no clipping, collision, unreadable metrics, or loss of provenance/status meaning.
>
> ### P11 — Final quality gate
> Required:
> - `pnpm check`;
> - `pnpm test`;
> - regression tests;
> - `pnpm build`;
> - replay determinism;
> - evidence integrity;
> - data-flow review;
> - GitHub Quality Gate;
> - Buku Besar/status map update.
>
> ## 4. SCIENTIFIC SAFETY RULE
>
> A reported experimental frequency is never automatically converted into `f0` or resonance fingerprint. Unknown remains unknown until the relevant sweep/evidence exists.
>
> ## 5. AI LABORATORY LOOP
>
> ```text
> Literature / Existing Evidence
>          ↓
> Simulation + Hypothesis
>          ↓
> AI identifies uncertainty/gaps
>          ↓
> AI recommends laboratory tests
>          ↓
> Laboratory observation
>          ↓
> Provenance + quality assessment
>          ↓
> Strengthen / weaken / contradict / new finding
>          ↓
> Updated knowledge base
>          ↓
> Better model + better next experiment
> ```
>
> The system must prefer informative new experiments over blindly repeating already-established experiments, while still allowing replication when required to increase confidence.
>
> ## 6. NEXT ACTION
>
> The next implementation action is **P0 closure only**. After P0 passes its gate, activate **P1**, then P2. No P3+ visual work should be merged into the P0/P1 checkpoint.
