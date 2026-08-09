# IUVFES Process Physics Extension — 2026-08

This document consolidates the process requirements discussed for the digital twin.

## 1. Physical-time principle

Every process variable is recorded against `physicalTimeS`. A simulation must not jump directly from an initial condition to a target temperature/pressure while hiding the transient path.

## 2. Energy and power

Electrical power is a process input. Heater, vacuum pump, vibration system and controls can be recorded separately. Electrical energy is accumulated over time. Effective heating power must account for an explicit efficiency assumption and heat loss.

The simple thermal balance implemented here is a screening contract, not a universal heat-transfer model. Phase change, convection, conduction, radiation, geometry and material-property correlations must be added where required.

## 3. Vessel geometry and thermal mass

Vessel volume, wall mass/heat capacity, headspace and free-surface area are explicit inputs. Larger equipment does not automatically imply a fixed multiplier in process time: the result emerges from thermal mass, heat transfer, losses, geometry and power.

## 4. Vacuum line and distribution

Pump rated capacity is distinct from effective pumping speed at the vessel. Pipe length, diameter, fittings, valves and conductance influence pressure dynamics. The current conductance module is deliberately a screening contract; the final simulator must select the appropriate vacuum-flow regime and correlations (molecular, transitional or viscous) from the actual pressure, gas load and geometry.

## 5. Water-assisted vibration / ultrasonics

Water volume is an explicit process variable. Frequency, electrical power, duty cycle, transducer efficiency, temperature and medium properties are recorded. The model must not assume that changing water volume automatically changes drive frequency; it changes thermal mass and acoustic coupling, while the actual system response requires validated acoustic/structural data.

## 6. Frozen material and freeze-drying

Frozen material is represented by phase state and pre-treatment history. Freeze-drying is distinguished from ordinary vacuum drying. Ice-to-vapor sublimation, condenser/ice-trap capacity and porous-structure evolution are future detailed physics modules; the current contract records the state variables without inventing kinetics.

## 7. Fish matrix / fish-oil recovery

Fish can be represented as a multicomponent matrix containing moisture, lipid, protein and other constituents. Vacuum heating can be studied for dehydration and lipid release, but oil recovery is not assumed to occur automatically. Yield must be measured or supported by a validated model. Water content and water activity are distinct variables; low water activity supports shelf-stability analysis but does not by itself prove food safety or shelf life.

## 8. Evidence and knowledge loop

Every new observation remains `OBSERVED` until quality screening and validation. Material revisions are immutable. New evidence can create a new model revision and trigger simulation comparison.

```text
material + pre-treatment
        ↓
equipment geometry
        ↓
power / heater / pump / vibration
        ↓
physical-time process
        ↓
T(t), P(t), mass(t), composition(t), phase(t)
        ↓
experiment evidence
        ↓
quality + uncertainty
        ↓
validation
        ↓
material/model revision
```

## 9. Engineering boundary

The modules added here provide explicit state, accounting and validation contracts. They do not claim that a simplified equation is sufficient for equipment design, food safety, vacuum-system sizing, acoustic resonance prediction, or freeze-drying cycle qualification. Those domains require validated correlations, measured equipment curves and appropriate engineering review.
