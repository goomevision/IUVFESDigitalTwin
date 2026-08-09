# IUVFES-VMMES Master Hardware Specification

## 1. Purpose

This document defines the **Virtual Hardware Engineering** baseline for the IUVFES Virtual Multi-Stage Molecular Extraction System (VMMES).

The objective is to make physical hardware a first-class Digital Twin object so that dimensions, materials, capacities, sensors, actuators, operating limits and uncertainty can be varied before a physical prototype is built.

The simulator may therefore evaluate:

- process performance;
- heating and cooling response;
- vacuum evacuation dynamics;
- condensation capacity;
- mass and energy balance;
- sensor and actuator response;
- pressure/temperature transients;
- safety envelope and interlocks;
- design alternatives and sensitivity;
- failure scenarios; and
- predicted-vs-actual behaviour after physical commissioning.

**Important:** this is a simulation/engineering baseline, not a manufacturing drawing or safety certificate. Physical pressure/vacuum equipment must be designed, reviewed, inspected and tested by competent engineering personnel using the applicable codes, regulations, drawings, material certificates and vendor data.

## 2. Hardware hierarchy

```text
IUVFES-VMMES
├── VR-001 Vacuum Reactor
├── HJ-001 Heating Jacket
├── US-001 Ultrasonic System
├── VP-001 Vacuum Pump
├── CT-001 Cold Trap 1
├── CT-002 Cold Trap 2
├── CT-003 Cold Trap 3
├── CT-004 Cold Trap 4
├── PT/TT/LT/FT/WT Instrumentation
├── XV Valves / Vacuum Breaker / Vent
├── PLC + Control Layer
└── Safety / Interlock Layer
```

## 3. Baseline process hardware

| Asset | Baseline | Status |
|---|---|---|
| VR-001 Reactor | 200–250 L, nominal 250 L; SS316L; 10–200 mbar absolute; 30–60 °C | SIMULATION BASELINE |
| HJ-001 Heating Jacket | 6–12 kW | SIMULATION BASELINE |
| US-001 Ultrasonic | 20–40 kHz; 3–6 kW | SIMULATION BASELINE |
| VP-001 Vacuum Pump | 100–300 m³/h nominal range | SIMULATION BASELINE |
| CT-001 | +5 to 0 °C | SIMULATION BASELINE |
| CT-002 | −20 °C | SIMULATION BASELINE |
| CT-003 | −40 °C | SIMULATION BASELINE |
| CT-004 | −70 to −80 °C | SIMULATION BASELINE |

## 4. Reactor virtual hardware model

The reactor model must support:

- internal diameter;
- shell length;
- shell/head geometry;
- working volume;
- wall/head thickness;
- material grade;
- corrosion allowance;
- nozzles and reinforcement;
- supports/stiffeners;
- jacket geometry;
- insulation;
- design temperature;
- operating temperature;
- design external pressure/vacuum;
- operating absolute pressure;
- leak rate; and
- structural verification metadata.

### Vacuum design rule

The simulator must **not** declare a vacuum vessel safe from a simple internal-pressure membrane-thickness equation alone. External-pressure stability/buckling, geometry, unsupported length, stiffeners, heads, openings, welds and applicable pressure-vessel code checks must be represented or explicitly marked as engineering-review requirements.

A zero/unverified thickness is therefore a deliberate `DATASHEET_REQUIRED`/engineering-input state in the baseline rather than a fabricated value.

## 5. Heating system

`HJ-001` must support:

- heater power;
- jacket heat-transfer area;
- heating medium;
- inlet/outlet temperature;
- flow rate;
- heat-transfer coefficient;
- reactor wall thermal mass;
- insulation and heat loss; and
- heater response time.

The thermal model should use energy balance and thermal inertia rather than a fixed temperature jump.

## 6. Ultrasonic system

`US-001` baseline:

- frequency: 20–40 kHz;
- power: 3–6 kW.

Additional engineering inputs:

- number of transducers;
- power per transducer;
- amplitude;
- duty cycle;
- mounting location;
- coupling conditions;
- operating-temperature limit; and
- actual vendor performance data.

Extraction enhancement parameters must be calibrated experimentally rather than treated as universally valid constants.

## 7. Vacuum system

`VP-001` baseline:

- nominal capacity: 100–300 m³/h.

Required engineering inputs:

- pump type;
- ultimate pressure;
- pump curve;
- motor power;
- speed/control mode;
- gas/vapor tolerance;
- liquid carryover protection;
- piping volume;
- valve Cv/position;
- leak rate; and
- service conditions.

The Digital Twin must calculate actual evacuation behaviour from the pump curve and connected system, not from nominal free-air capacity alone.

## 8. Condensation system

Four cold-trap stages are represented.

Each trap must support:

- temperature setpoint;
- vessel volume;
- heat-transfer area;
- cooling capacity;
- condensate capacity;
- insulation;
- level/weight measurement;
- inlet/outlet pressure; and
- thermal response time.

A trap reaching its validated capacity must become a process/safety event and may trigger a vacuum-pump protection interlock where applicable.

## 9. Instrumentation

Minimum logical instrument set:

| ID | Type | Location | Primary role |
|---|---|---|---|
| PT-001 | Absolute pressure | Reactor | Vacuum/process state |
| TT-001 | Temperature | Reactor | Thermal state |
| LT-001 | Level | Cold Trap 1 | Condensate protection |
| FT-001 | Flow | Cooling circuit | Cooling verification |
| WT-001 | Mass | Reactor support | Mass balance |

Every real instrument record must eventually contain:

- manufacturer/model;
- measurement range;
- accuracy;
- resolution;
- response time;
- unit;
- installation location;
- serial/asset ID;
- calibration ID;
- calibration date;
- calibration status; and
- data-quality flag.

## 10. Valves and actuators

The virtual hardware layer represents isolation, vent, control and vacuum-breaker functions.

Required parameters include:

- valve type;
- Cv;
- nominal size;
- pressure rating;
- temperature rating;
- actuator type;
- response time;
- fail position;
- command position;
- measured position; and
- maintenance state.

## 11. Safety hardware

The Digital Twin safety model must be capable of representing, where physically applicable:

- emergency stop;
- independent interlock logic;
- vacuum breaker/controlled vent;
- over-pressure protection;
- temperature shutdown;
- pump isolation;
- liquid carryover protection;
- sensor plausibility checks; and
- alarm/event recording.

AI optimisation must not be treated as a substitute for independent safety functions.

## 12. Design variables

The user should eventually be able to create a hardware revision and vary:

```text
Reactor volume
Diameter
Shell/head geometry
Wall thickness
Material grade
Corrosion allowance
Jacket area
Heater power
Ultrasonic frequency/power
Pump capacity and pump curve
Pipe diameter/length
Valve Cv and opening rate
Cold-trap temperature/capacity
Sensor range/accuracy/response time
Cooling capacity
Insulation
Material mass/moisture/density
```

## 13. Design-space analysis

IUVFES should support parameter sweeps such as:

```text
Thickness:       6 / 8 / 10 / 12 mm
Reactor volume:  200 / 250 / 350 / 500 L
Heater power:    6 / 8 / 12 / 16 kW
Pump capacity:   100 / 150 / 200 / 300 m³/h
```

Each candidate must produce a versioned simulation result rather than overwriting another design.

## 14. Failure and what-if simulation

Examples:

- vacuum valve opens too quickly;
- vacuum pump oversize/undersize;
- cooling flow lost;
- heater stuck on;
- sensor drift/failure;
- cold trap reaches capacity;
- excessive leak rate;
- pressure transient;
- temperature transient;
- actuator response delay.

Each scenario must produce causal frames and events, not only a final alarm.

## 15. Manufacturing tolerance and uncertainty

A future uncertainty layer should vary:

- thickness tolerance;
- diameter tolerance;
- material properties;
- heater output;
- pump capacity;
- valve response;
- leak rate;
- sensor accuracy; and
- environmental conditions.

Outputs should distinguish nominal, best/worst case and statistically modelled scenarios. Probabilities must never be presented as measured facts unless supported by an appropriate statistical dataset.

## 16. Digital hardware passport

Every physical asset should eventually have a versioned passport:

```text
Asset ID
Manufacturer / model
Geometry
Material
Design limits
Operating limits
Sensors
Actuators
Calibration
Inspection
Maintenance
Engineering calculations
Simulation history
Revision history
Physical commissioning evidence
Validation status
```

## 17. Physical-to-digital validation loop

```text
VIRTUAL DESIGN
      ↓
SIMULATION
      ↓
FAILURE / SAFETY REVIEW
      ↓
DESIGN REVISION
      ↓
PROTOTYPE / PHYSICAL BUILD
      ↓
REAL SENSOR DATA
      ↓
COMPARE PREDICTED vs ACTUAL
      ↓
CALIBRATE DIGITAL TWIN
      ↓
VALIDATED MODEL
```

This is the intended path from virtual engineering to scientific validation.

## 18. Parameter provenance

Every parameter must eventually be tagged as one of:

- `BASELINE` — project concept baseline;
- `ASSUMED` — temporary assumption;
- `DATASHEET_REQUIRED` — must be supplied by vendor/engineering source;
- `CALCULATED` — generated by an engineering calculation;
- `MEASURED` — obtained from a physical instrument/test;
- `VALIDATED` — verified against suitable evidence.

The system must never silently convert an assumption into a verified engineering fact.

## 19. Implementation status

The initial typed baseline is implemented in `server/hardwareSpecification.ts`.

Current scope is intentionally a **Virtual Hardware Engineering data model**. It does not yet claim complete pressure-vessel FEA, CAD geometry import, certified code calculation, vendor-data ingestion, or physical safety certification.

The next engineering layers should add:

1. hardware revision CRUD;
2. parameter provenance and evidence attachments;
3. geometry/CAD import;
4. pump and valve performance curves;
5. structural/external-pressure calculation adapters;
6. thermal/condensation hardware coupling;
7. uncertainty and design-space sweeps;
8. hardware-to-experiment linkage; and
9. predicted-vs-actual commissioning validation.
