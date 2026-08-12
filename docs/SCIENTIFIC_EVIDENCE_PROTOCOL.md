# IUVFES Scientific Evidence Protocol

## 1. Three mandatory result layers

Every material/experiment report must expose exactly three scientifically distinct result sections:

1. **Established / Tested Result**
   - Uses only laboratory observations and independently supported evidence.
   - Never substitutes a simulation value for a measured value.
   - Reports uncertainty, sample context and provenance where available.

2. **Estimated / Unverified Possibility**
   - Uses literature observations, model assumptions, incomplete measurements and explicit hypotheses.
   - Every estimate carries its source and uncertainty/confidence.
   - Estimated `f0`, bandwidth, Q-factor or resonance mechanism must never be written as laboratory fact.

3. **AI Analysis**
   - AI may compare the first two layers, identify patterns, conflicts and knowledge gaps.
   - AI conclusions remain derived analysis unless independently validated.
   - AI must state why it recommends the next laboratory test.

## 2. Sample identity is part of the evidence

A result is not considered directly comparable unless sample context is sufficiently matched. The system must preserve, where available:

- scientific/common name and plant part;
- fresh/wet/dried/frozen/freeze-dried/thawed/powder state;
- moisture and initial mass;
- geographic origin, altitude and cultivation context;
- cultivar/variety and biological maturity;
- soil/fertilizer/irrigation or other cultivation treatment;
- harvest date, storage duration and post-harvest treatment;
- particle size and preparation method;
- extraction solvent, ratio, temperature, pressure, power, amplitude, duty cycle and time;
- instrument, calibration and laboratory identity.

If these differ materially, the engine must lower comparability rather than silently pool the measurements.

## 3. Replication rule

Repeated results from the same sample, protocol and laboratory increase precision but do not automatically establish independent replication. Independent laboratories/samples/protocols must be represented separately.

When results agree, the evidence strength may increase according to the configured evidence score. When results conflict, the system opens an evidence conflict and does not average away the disagreement.

## 4. Closed scientific loop

`Literature -> hypothesis -> AI recommendation -> laboratory test -> raw observation -> comparison -> validation/contradiction -> model update -> next recommendation`

A laboratory result must remain immutable. Model updates create new versions; they never rewrite the historical observation.

## 5. Stopping duplicate experiments

Before recommending a test, AI must search comparable historical experiments. If the question has already been answered with sufficiently strong evidence under materially equivalent sample/protocol conditions, the system should recommend reuse of the existing evidence rather than repeat the same experiment.

If a repeat is scientifically valuable, its purpose must be explicit: replication, validation, falsification, calibration or resolving a conflict.
