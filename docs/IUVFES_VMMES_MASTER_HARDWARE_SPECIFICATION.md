# IUVFES-VMMES Master Hardware Specification

## Purpose

Virtual Hardware Engineering baseline for the IUVFES Virtual Multi-Stage Molecular Extraction System (VMMES). Physical hardware is treated as a first-class Digital Twin object so geometry, material, capacity, sensors, actuators, operating limits, tolerances and uncertainty can be varied before physical construction.

This specification is a **simulation baseline**, not a manufacturing drawing, pressure-vessel certificate or safety certification. Unverified physical values are explicitly marked as engineering inputs rather than invented values.

## Baseline hardware

| Asset | Baseline | Status |
|---|---|---|
| VR-001 Vacuum Reactor | 200–250 L; nominal 250 L; SS316L; 10–200 mbar absolute; 30–60 °C | BASELINE |
| HJ-001 Heating Jacket | 6–12 kW | BASELINE |
| US-001 Ultrasonic | 20–40 kHz; 3–6 kW | BASELINE |
| VP-001 Vacuum Pump | 100–300 m³/h nominal range | BASELINE |
| CT-001 | +5 to 0 °C | BASELINE |
| CT-002 | −20 °C | BASELINE |
| CT-003 | −40 °C | BASELINE |
| CT-004 | −70 to −80 °C | BASELINE |

## Virtual hardware parameters

### VR-001 Reactor

The model must support internal diameter, shell length, head geometry, working volume, shell/head thickness, material grade, corrosion allowance, nozzles, reinforcement, stiffeners, supports, jacket geometry, insulation, design temperature, operating temperature, design external pressure/vacuum, operating absolute pressure and leak rate.

**Vacuum rule:** a simple internal-pressure thickness equation must not be used as the sole safety check. External-pressure stability/buckling, unsupported length, heads, openings, stiffeners, welds and applicable pressure-vessel engineering checks must be represented or explicitly marked for engineering review.

Geometry and structural values that are not sourced from a drawing or engineering calculation remain `DATASHEET_REQUIRED`.

### HJ-001 Heating Jacket

Parameters: heater power, jacket area, heating medium, inlet/outlet temperature, flow, heat-transfer coefficient, wall thermal mass, insulation, heat loss and heater response time. The simulator must use energy balance and thermal inertia rather than a fixed temperature jump.

### US-001 Ultrasonic

Baseline frequency 20–40 kHz and power 3–6 kW. Additional parameters: transducer count, power per transducer, amplitude, duty cycle, mounting, coupling and temperature limit. Extraction enhancement must be calibrated against experiments.

### VP-001 Vacuum Pump

Baseline nominal capacity 100–300 m³/h. Required parameters: pump type, ultimate pressure, vendor pump curve, motor power, control mode, vapor tolerance, liquid carryover protection, connected piping volume, valve Cv/position and leak rate. Evacuation must be calculated from the connected system and pump curve, not nominal capacity alone.

### CT-001 … CT-004 Cold Traps

Each trap must model temperature setpoint, volume, heat-transfer area, cooling capacity, condensate capacity, insulation, level/weight, inlet/outlet pressure and thermal response. Trap capacity is a process/safety state and may trigger pump protection/interlock.

### Instrumentation

Minimum logical instruments:

- PT-001 — absolute reactor pressure;
- TT-001 — reactor temperature;
- LT-001 — Cold Trap 1 level;
- FT-001 — cooling-circuit flow;
- WT-001 — reactor/material mass.

Real instruments must eventually carry manufacturer/model, range, accuracy, resolution, response time, location, serial/asset ID, calibration ID/date/status and data-quality flag.

### Valves and actuators

Model isolation, control, vent and vacuum-breaker valves with nominal size, Cv, pressure/temperature rating, actuator type, response time, fail position, command position, measured position and maintenance state.

### Safety hardware

Represent emergency stop, independent interlocks, vacuum breaker/controlled vent, over-pressure protection, temperature shutdown, pump isolation, liquid carryover protection, sensor plausibility checks and alarm/event recording. AI optimisation is not a substitute for independent safety functions.

## Design variables

The simulator must eventually allow revisions that vary:

- reactor volume, diameter, shell/head geometry and wall thickness;
- material grade and corrosion allowance;
- jacket area and heater power;
- ultrasonic frequency/power;
- pump capacity and pump curve;
- pipe diameter/length and valve Cv/opening rate;
- cold-trap temperature/capacity;
- sensor range/accuracy/response time;
- cooling capacity and insulation;
- material mass, moisture and density.

## Design-space and failure simulation

The system should support parameter sweeps and versioned candidate designs. Example variables include 6/8/10/12 mm thickness, 200/250/350/500 L volume, 6/8/12/16 kW heating and 100/150/200/300 m³/h pump capacity.

Failure scenarios include rapid vacuum-valve opening, pump over/undersizing, cooling loss, heater stuck-on, sensor failure/drift, cold-trap saturation, excessive leak, pressure/temperature transient and actuator delay. Each scenario must generate causal frames and events.

## Uncertainty and tolerances

Future analysis should vary manufacturing thickness/diameter tolerances, material properties, heater output, pump capacity, valve response, leak rate, sensor accuracy and environmental conditions. Results must distinguish nominal, best/worst case and statistically modelled scenarios; probabilities are not measured facts without suitable evidence.

## Digital hardware passport

Each asset should eventually contain Asset ID, manufacturer/model, geometry, material, design/operating limits, sensors, actuators, calibration, inspection, maintenance, engineering calculations, simulation history, revision history, physical commissioning evidence and validation status.

## Parameter provenance

Every parameter is tagged as:

- `BASELINE` — project concept value;
- `ASSUMED` — temporary assumption;
- `DATASHEET_REQUIRED` — vendor/engineering input required;
- `CALCULATED` — engineering calculation output;
- `MEASURED` — physical measurement;
- `VALIDATED` — supported by suitable evidence.

The simulator must never silently convert an assumption into a verified engineering fact.

## Physical validation loop

```text
VIRTUAL DESIGN → SIMULATION → FAILURE/SAFETY REVIEW
        → DESIGN REVISION → PHYSICAL BUILD
        → REAL SENSOR DATA → PREDICTED vs ACTUAL
        → CALIBRATION → VALIDATED DIGITAL TWIN
```

## Implementation roadmap

1. Hardware revision CRUD.
2. Parameter provenance/evidence attachments.
3. Geometry/CAD import.
4. Pump and valve performance curves.
5. Structural/external-pressure calculation adapters.
6. Thermal/condensation hardware coupling.
7. Uncertainty and design-space sweeps.
8. Hardware-to-experiment linkage.
9. Predicted-vs-actual commissioning validation.
