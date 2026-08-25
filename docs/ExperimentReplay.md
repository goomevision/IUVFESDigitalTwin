# Scientific Experiment Replay

The replay control room provides a deterministic visual review of a completed Digital Twin run.

## Route

`/replay/:experimentId`

The route loads the persisted simulation result for the experiment and exposes a timeline cursor.

## Controls

- Play / pause
- Start / reset
- Single-frame backward and forward stepping
- 0.5x, 1x, 2x and 4x playback speed
- Timeline slider

## Review data

The replay displays the selected frame's time, pressure, temperature and recovered oil, together with the process-stage indicator and temperature history.

## Scientific boundary

Replay is a visualization of persisted simulation output. It does not recreate missing laboratory observations and it does not claim that inferred stage labels are measured facts. When real sensor/event timelines are persisted, this UI should be extended to replay those records alongside the simulation timeline.

## Next extension

Persist process events and controller state as first-class records so replay can show actuator commands, interlocks, alarms, operator observations and measured sensor values on a synchronized timeline.
