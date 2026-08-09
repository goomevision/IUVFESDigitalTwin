# Scientific Event Journal

The IUVFES closed-loop simulator now records a causal event journal for each run.

## What is recorded

Each causal timestep produces a `CAUSAL_STEP` event containing:

- simulation time and step number;
- sensor state before actuation;
- process/controller/interlock state;
- actuator commands;
- sensor state after machine dynamics.

A final `RUN_TERMINAL` event records the terminal status, final sensors, frame count and paused steps.

## Integrity chain

Events form a SHA-256 hash chain:

```text
Event 1
  hash H1
    ↓
Event 2
  previousHash = H1
  hash H2
    ↓
Event 3
  previousHash = H2
  hash H3
```

The canonical representation sorts object keys before hashing, so equivalent JSON object ordering produces the same digest. A changed payload or predecessor changes the event hash.

## Scientific meaning

The journal is an audit/provenance mechanism. It does **not** make a simulation physically valid by itself. Simulation outputs remain simulation data until the model is calibrated and validated against laboratory measurements.

## Database migration

Apply `drizzle/0002_scientific_event_journal.sql` after `0001_closed_loop_sessions.sql` before running closed-loop experiments against a database.

The current closed-loop API records the event chain before publishing the simulation result. If the journal cannot be persisted, the run is not reported as an auditable result.
