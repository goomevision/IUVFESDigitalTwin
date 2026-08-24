# Implementation checklist — Causal Frame Visual Sync

This document is the implementation gate for the Process Simulator UI.

### Current engine evidence

`CausalFrame` contains `timestampSeconds`, `controllerAfterActuation`, `actuatorLevels`, `effectiveCommands`, `sensorAfter`, `materialInventory`, `safety`, `ultrasonic`, and `hardwareDiagnostics` in one causal record.

### Renderer requirements

The 3D renderer must consume those fields from the exact `frame` prop currently displayed. It must not reconstruct state from independent timers.

For smooth animation, `requestAnimationFrame` is allowed only as a rendering cadence. It must never advance the simulation timestamp or invent a new process state.

### Current known gap

The existing `ProcessMachine3D` visual mapping uses `effectiveCommands` for several visual ON/OFF decisions. That is safe for command state, but it does not yet expose continuous actuator intensity from `actuatorLevels` for all animated subsystems.

Therefore the synchronization contract is now explicitly tested, while the remaining renderer work is:

- map heater intensity to `actuatorLevels.heater`;
- map vacuum intensity to `actuatorLevels.vacuumPump`;
- map condenser flow to `actuatorLevels.condenser`;
- map cooling flow to `actuatorLevels.cooling`;
- map extractor activity to `actuatorLevels.extractor`;
- keep `effectiveCommands` as the ON/OFF/interlock authority;
- keep `timestampSeconds` as the sole process-time authority;
- ensure ENGINE PROGRESS and numerical panels consume the same selected/current frame.

### Scientific boundary

Do not label this as a completed thermodynamic energy-balance validation. Energy closure requires an independent physics audit.
