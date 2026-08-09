# Advanced Process Simulation

## Objective

The Digital Twin should behave like a virtual machine rather than a static dashboard. The operator should be able to observe the process progressing through explicit machine stages while the simulated measurements evolve with the physics engine output.

## Process lifecycle

1. **PRE-FLIGHT** — sensor/interlock readiness and process initialization.
2. **CHARGE** — material loading and mass-balance initialization.
3. **VACUUM** — chamber pressure moves toward the configured target.
4. **HEAT-UP** — temperature ramps toward the configured target.
5. **EXTRACTION** — water removal and oil recovery evolve from the selected process model.
6. **CONDENSATION** — recovered vapor/condensate state is represented in the control room.
7. **COOL-DOWN** — process returns toward a handling state.
8. **COMPLETE** — final simulation frame and balances are displayed.

## Architecture

`server/physicsEngine.ts` remains the source of simulated process data. `client/src/components/ProcessSimulator.tsx` is the operator-facing process playback layer. It consumes the engine's `realTimeData` frames and presents them sequentially, so the operator sees the machine evolve rather than receiving the final result immediately.

The control room exposes:

- stage progression;
- chamber pressure;
- process temperature;
- recovery yield;
- energy load;
- oil/water mass recovery;
- machine component states;
- a live trend trace;
- start/pause/resume/reset/exit controls;
- error/alarm presentation.

## Next engineering phase

The current stage boundaries are intentionally UI-level mappings over the existing simulation frames. The next phase should move stage state into the simulation domain itself, add sensor/interlock events, component-level models, event logs, AI recommendations, and multi-variable synchronized charts. This will make the simulator causally faithful to the underlying machine model instead of only replaying the generated frames.
