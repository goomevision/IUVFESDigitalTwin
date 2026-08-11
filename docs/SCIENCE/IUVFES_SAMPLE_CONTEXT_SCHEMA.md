# IUVFES Sample Context & Experiment Identity Contract

This contract extends the scientific evidence architecture with explicit sample context. It is designed to prevent different physical specimens from being incorrectly treated as equivalent merely because they share a species/material name.

## 1. Material vs Sample

```text
MATERIAL
  |
  +-- SAMPLE-001 (fresh)
  +-- SAMPLE-002 (oven dried)
  +-- SAMPLE-003 (freeze dried)
```

`material_id` identifies the material class. `sample_id` identifies the actual specimen/batch used in an experiment.

## 2. Sample Identity

Recommended logical fields:

```typescript
interface SampleIdentity {
  sampleId: string;
  materialId: string;

  biological: {
    species?: string;
    cultivar?: string;
    genotype?: string;
    plantPart?: string;
    subPart?: string;
    ageDays?: number;
    growthStage?: string;
  };

  origin: {
    country?: string;
    province?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    altitudeM?: number;
  };

  cultivation: {
    system?: 'WILD' | 'FARM' | 'GREENHOUSE' | 'UNKNOWN';
    soilType?: string;
    soilPH?: number;
    fertilizerType?: string;
    fertilizerDetails?: string;
    pesticideUsed?: boolean;
    irrigation?: string;
  };

  harvest: {
    date?: string;
    time?: string;
    season?: string;
    harvestStage?: string;
  };

  physicalState: {
    state?: 'FRESH' | 'WET' | 'DRIED' | 'FROZEN' | 'FREEZE_DRY' | 'OTHER' | 'UNKNOWN';
    moisturePercent?: number;
  };

  processing: {
    washing?: string;
    dryingMethod?: string;
    dryingTemperatureC?: number;
    dryingDurationH?: number;
    freezingTemperatureC?: number;
    storageTemperatureC?: number;
    storageDurationDays?: number;
    freezeThawCycles?: number;
    cutting?: string;
    grinding?: string;
    sieving?: string;
    particleSizeMm?: number;
  };

  lineage?: {
    parentSampleId?: string;
    sourceBatchId?: string;
  };
}
```

## 3. Unknown Handling

Do not silently substitute missing values with defaults.

Recommended representation:

```typescript
interface UnknownField {
  field: string;
  reason?: 'NO_DATA' | 'NOT_MEASURED' | 'NOT_REPORTED' | 'NOT_APPLICABLE' | 'WITHHELD';
  researchPriority?: number;
}
```

An absent value and an actual zero must remain distinguishable.

## 4. Experiment Context

```typescript
interface ExperimentContext {
  experimentId: string;
  sampleId: string;
  purpose:
    | 'EXPLORATION'
    | 'REPLICATION'
    | 'VALIDATION'
    | 'FALSIFICATION'
    | 'CALIBRATION'
    | 'COMPARISON'
    | 'PARAMETER_SWEEP'
    | 'MODEL_TEST';

  scientificQuestion?: string;
  hypothesisId?: string;

  controlledVariables: string[];
  experimentalVariables: string[];
  observedVariables: string[];
}
```

## 5. Experimental Signature

An experiment should produce a deterministic signature from critical comparison fields. The signature is used for duplicate/near-duplicate detection, not as a reason to prohibit experiments.

Conceptually:

```text
sample context
+ preparation
+ protocol
+ hardware configuration
+ operating parameters
+ experiment objective
= experimental signature
```

Comparison outcomes:

- `EXACT_MATCH`
- `NEAR_MATCH`
- `NOVEL`
- `UNKNOWN_COMPARABILITY`

## 6. Sample Comparability

Comparability should consider at minimum:

- same species/material;
- same or compatible plant part;
- sample state;
- moisture;
- preparation;
- particle size;
- batch/lineage;
- geography/altitude where relevant;
- harvest stage/time;
- storage history;
- protocol;
- hardware.

A species match alone does not imply experimental equivalence.

## 7. Matched-Sample Design

IUVFES should support controlled comparisons such as:

```text
same source batch
  |
  +-- fresh
  +-- oven dried
  +-- freeze dried
```

followed by the same controlled extraction protocol. This allows sample-state effects to be studied without confusing them with unrelated biological differences.

## 8. Context-Aware Modeling

A future response model should not be hard-coded as frequency-only:

```text
Yield = f(Frequency)
```

Instead, the architecture must be capable of representing:

```text
Yield = f(
  material,
  sample context,
  preparation,
  solvent,
  frequency,
  acoustic intensity/power,
  temperature,
  pressure,
  time,
  duty cycle,
  hardware
)
```

This does not assert causality. It provides the dimensions needed to test associations and interactions.

## 9. Required Report Display

Every laboratory or simulation report should display sample context before interpreting results:

```text
SAMPLE IDENTITY
Species / Material
Plant part
Origin
Altitude
Cultivation
Fertilizer
Growth stage
Harvest
Sample state
Moisture
Drying / freezing history
Storage
Particle size
```

Unknown values should visibly remain `UNKNOWN`.

## 10. AI Recommendation Output

When context is incomplete, AI should say what cannot safely be inferred and recommend the minimum useful measurement.

Example:

```text
Knowledge gap:
Sample altitude is unknown.

Impact:
Geographic comparison cannot be interpreted confidently.

Recommendation:
Record altitude for future samples or use a matched sampling design.
```

## 11. Scientific Integrity Rule

The purpose of sample context is not to create an enormous form that operators must fill blindly. Fields should be:

- required only when scientifically necessary for the selected experiment;
- optional when not relevant;
- explicitly unknown when unavailable;
- traceable when supplied from another source.

The system must prefer an explicit `UNKNOWN` over a fabricated value.
