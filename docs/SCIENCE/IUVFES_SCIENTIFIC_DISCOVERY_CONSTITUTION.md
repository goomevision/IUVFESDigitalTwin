# IUVFES Scientific Discovery & Evidence Constitution

**Status:** ACTIVE DESIGN CONTRACT  
**Purpose:** scientific integrity, reproducibility, provenance, simulation/laboratory separation, and human-AI experimental learning.

> This document is a system contract. It does not promote a hypothesis, simulation result, literature value, or AI inference into experimental truth without explicit evidence.

---

## 1. Mission

IUVFES is a Digital Twin / scientific experimentation platform intended to connect:

`human question -> simulation -> laboratory experiment -> evidence -> knowledge update -> AI analysis -> next experiment`.

The objective is not to maximize the number of simulated results. The objective is to maximize **traceable, reproducible, and appropriately qualified scientific knowledge**.

---

## 2. Non-Negotiable Scientific Boundaries

### 2.1 Source separation

The following source classes remain distinct:

- `LITERATURE`
- `LABORATORY`
- `SIMULATION`
- `DERIVED`
- `HYPOTHESIS`
- `AI_ANALYSIS`

A value must never silently change source class.

Examples:

- A literature report of 40 kHz and 2.70% yield is an observed literature condition/result; it is **not automatically a resonance fingerprint**.
- A simulated peak is a model result; it is **not a laboratory observation**.
- An AI inference is an inference; it is **not a measured value**.
- An unknown parameter remains `UNKNOWN` until supported by evidence.

### 2.2 Resonance boundary

A response peak in a frequency sweep must initially be described as an **observed response peak**. It must not automatically be labelled molecular resonance.

A resonance-related hypothesis requires appropriate evidence, controls, repeatability, characterization, and exclusion of plausible alternative explanations.

### 2.3 Unknown is valid scientific state

Missing information must be stored explicitly as `UNKNOWN` with an optional reason and research priority. The system must not fabricate values merely to make a model complete.

---

## 3. Three Mandatory Result Layers

Every scientific report must separate:

### A. VERIFIED / OBSERVED RESULT

Data directly measured, replicated, supported, or explicitly reported by an identified source.

### B. ESTIMATED / MODEL RESULT

Predictions, interpolation, extrapolation, reduced-order simulation, fitted parameters, assumptions, and probabilistic estimates.

### C. AI ANALYSIS

Patterns, correlations, anomalies, conflicts, hypotheses, knowledge gaps, and experimental recommendations generated from available evidence.

The report must additionally expose:

- `UNKNOWN / KNOWLEDGE GAPS`
- `NEXT EXPERIMENT`

No model or AI output may be silently promoted into verified evidence.

---

## 4. Material Is Not the Same as Sample

`MATERIAL` identifies the biological/material class, for example `Pogostemon cablin`.

`SAMPLE` identifies the actual experimental specimen and its context.

Two samples of the same species are not assumed equivalent when relevant context differs, including:

- fresh / wet / dried / frozen / freeze-dried;
- moisture;
- drying method and conditions;
- freeze/thaw history;
- storage;
- plant part and sub-part;
- cultivar/genotype when known;
- geographic origin;
- altitude;
- cultivation system;
- fertilizer and treatment;
- soil/context;
- plant age and growth stage;
- harvest date/time/season;
- washing, cutting, grinding, sieving;
- particle size.

Unknown fields remain unknown.

---

## 5. Sample Lineage

Every experimental sample should be traceable through its lineage:

`MATERIAL -> SOURCE PLANT/BATCH -> HARVEST -> SAMPLE -> PROCESSING -> DERIVED SAMPLE -> EXPERIMENT`

Splitting a sample into fresh/dried/frozen or different preparation routes must preserve the parent-child relationship.

This enables matched-sample comparisons and prevents unrelated samples from being treated as replicates.

---

## 6. Experimental Context

Every experiment should identify three categories:

### Controlled variables
Parameters intentionally held constant.

### Experimental variables
Parameters intentionally changed.

### Observed variables
Measurements/results collected from the experiment.

The experiment must also have a declared purpose where possible:

- `EXPLORATION`
- `REPLICATION`
- `VALIDATION`
- `FALSIFICATION`
- `CALIBRATION`
- `COMPARISON`
- `PARAMETER_SWEEP`
- `MODEL_TEST`

A scientific question and optional hypothesis should be attached to experiments whenever practical.

---

## 7. Experiment Identity and Duplicate Prevention

Before a new experiment is proposed or executed, IUVFES should compare its experimental signature with existing records.

### Exact match
Critical material/sample/process/hardware parameters are equivalent.

### Near match
Most parameters are equivalent but one or more relevant variables differ.

### Novel
No sufficiently relevant prior experiment exists.

The system must not simply block repeated experiments. It should classify the reason for repetition:

- evidence already strong;
- independent replication required;
- calibration required;
- conflict resolution required;
- new variable under investigation;
- new sample context;
- audit/reproducibility requirement.

---

## 8. Evidence Accumulation

Repeated results should strengthen evidence only after considering:

- measurement quality;
- uncertainty;
- repeatability;
- sample consistency;
- instrument identity and calibration;
- operator/laboratory independence;
- protocol equivalence;
- inter-lab replication;
- agreement or disagreement with existing evidence.

A single opaque `confidenceScore` must not replace the evidence profile.

Recommended evidence dimensions:

- measurement quality;
- replication strength;
- independence;
- calibration status;
- sample comparability;
- literature agreement;
- model agreement;
- uncertainty.

---

## 9. Conflict Is Data

Conflicting results must never be deleted merely because they disagree.

The system should create an explicit `EVIDENCE_CONFLICT` record and ask whether differences may be associated with:

- sample state;
- moisture;
- cultivar/genetics;
- geography/altitude;
- fertilizer/cultivation;
- harvest stage;
- drying/storage;
- particle size;
- solvent;
- frequency;
- acoustic intensity/power;
- temperature;
- pressure;
- extraction time;
- hardware geometry;
- measurement method.

A conflict can become a new knowledge gap and a new experimental question.

---

## 10. Negative Evidence

A non-observation is also evidence.

For example:

`40 kHz -> no significant response under specified conditions`

must be retained as a qualified negative observation, not discarded.

Negative evidence may weaken a hypothesis, improve model discrimination, or prevent unnecessary future experiments.

---

## 11. Hypothesis Management

Every material/frequency hypothesis should support both:

1. a supporting test; and
2. a falsification test.

Example:

**Hypothesis:** response maximum is near 40 kHz.

**Supporting test:** replicate 40 kHz under the same protocol.

**Falsification test:** dense sweep around 35–45 kHz while controlling other relevant variables.

Possible states:

`UNKNOWN -> HYPOTHESIS -> MODEL -> OBSERVED -> REPLICATED -> SUPPORTED -> VALIDATED`

Alternative path:

`SUPPORTED -> CONTRADICTED -> REVISED -> NEW HYPOTHESIS`

No status transition may occur without an explicit evidence basis.

---

## 12. Frequency Sweep Rules

Frequency sweeps are exploratory unless independently justified otherwise.

The engine may detect:

- zero peaks;
- one peak;
- multiple peaks;
- broad response regions;
- conflicting/unstable peaks.

It must **not force four peaks**.

Peak outputs should retain:

- frequency;
- amplitude/response;
- prominence;
- bandwidth/FWHM when measurable;
- uncertainty;
- confidence/evidence context;
- sweep ID.

A detected peak should initially be labelled `OBSERVED_RESPONSE_PEAK`, not `MOLECULAR_RESONANCE`.

---

## 13. AI Experimental Planner

AI recommendations should prioritize experiments by scientific value, not only predicted yield.

Recommended decision dimensions:

- expected information gain;
- uncertainty reduction;
- scientific importance;
- replication need;
- conflict resolution value;
- novelty;
- cost;
- practical risk;
- feasibility.

Every recommendation should explain:

- what is unknown;
- what existing evidence was considered;
- why the experiment is informative;
- what it could confirm;
- what it could falsify;
- which variables should be controlled;
- which variable should change;
- what outcome would update the model.

---

## 14. AI Decision Ledger

Every accepted AI recommendation should be logged with:

- recommendation ID;
- model/version;
- evidence used;
- reason;
- predicted outcome;
- actual laboratory outcome;
- prediction error where measurable;
- information gain;
- whether the model was updated.

This allows IUVFES to evaluate whether its experimental planning becomes more useful over time.

---

## 15. Sample Comparability

Before comparing two experiments, IUVFES should classify comparability as appropriate:

- `HIGH`
- `MEDIUM`
- `LOW`
- `UNKNOWN`

Comparison must consider sample context as well as process conditions.

A species-level match alone is insufficient to claim experimental equivalence.

---

## 16. Provenance

Every important value should be traceable to its origin whenever technically possible:

- source type;
- dataset ID;
- experiment ID;
- sample ID;
- protocol ID;
- instrument ID;
- operator ID;
- laboratory ID;
- timestamp;
- software/model version;
- source file/hash where available;
- import method.

The goal is forensic reproducibility: a reviewer should be able to ask where a number came from and follow the chain.

---

## 17. Simulation vs Laboratory Separation

Simulation can:

- explore parameter space;
- generate model predictions;
- test software logic;
- estimate unmeasured scenarios;
- propose experiments.

Laboratory data can:

- provide real measurements;
- validate/revise model parameters;
- reveal unmodelled effects;
- establish reproducibility.

Simulation must never be used to manufacture laboratory evidence.

---

## 18. Central Knowledge Base Growth

The knowledge base should accumulate:

- known facts;
- observed results;
- validated results;
- model parameters;
- hypotheses;
- negative evidence;
- conflicts;
- unknowns;
- experimental recommendations;
- experiment outcomes.

The objective is to reduce unnecessary repetition while preserving useful independent replication.

---

## 19. Scientific Report Contract

Every final report should contain:

1. Experiment identity
2. Operator / laboratory
3. Sample identity and lineage
4. Sample context
5. Hardware configuration
6. Controlled variables
7. Experimental variables
8. Sensor data
9. Verified/observed results
10. Estimated/model results
11. AI analysis
12. Unknowns / knowledge gaps
13. Evidence profile
14. Replication and conflict status
15. Frequency response where applicable
16. Mass balance
17. Energy balance
18. Provenance
19. Model/software version
20. Recommended next experiments
21. Scientific boundary/disclaimer

---

## 20. Core Principle

> IUVFES must know what it knows, what it estimates, what it infers, where every value came from, what conflicts with it, what remains unknown, and what experiment would most efficiently reduce that uncertainty.

The system is therefore a collaboration between:

`HUMAN + SIMULATOR + LABORATORY + EVIDENCE ENGINE + AI + CENTRAL KNOWLEDGE BASE`.

The laboratory remains the route to real-world validation. AI remains an analytical and experimental-planning partner, not an authority that can declare unverified hypotheses to be facts.
