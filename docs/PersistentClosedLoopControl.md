# Persistent Closed-Loop Control

The Control Room now uses the causal closed-loop simulator one timestep at a time instead of running the complete simulation in a single browser request.

## Runtime sequence

```text
START
  -> create/load session
  -> STEP
  -> sensor state
  -> process interlocks
  -> controller
  -> actuator commands
  -> machine dynamics
  -> next sensor state
  -> persist snapshot
  -> repeat
```

## Operator controls

- **START** creates or resumes the experiment's closed-loop session.
- **PAUSE** persists the exact simulation snapshot and changes the experiment to `paused`.
- **RESUME** restores the persisted controller, dynamics, process state and PID memory, then continues from the next timestep.
- **STOP** stops the session and retains the causal history for review.
- **RESET** clears the browser presentation; it does not silently delete the server-side scientific record.

## Persistence

`closedLoopSessions` stores a versioned JSON snapshot containing configuration, sensors, process state, machine-dynamics state, PID controller memory, elapsed time, step number and causal frames. This makes a pause/resume operation independent of the browser process.

A migration is provided at `drizzle/0001_closed_loop_sessions.sql`.

## Scientific data boundary

The stored frames are simulation data. They must remain labelled as simulation data until the model has been calibrated and validated against laboratory measurements. The persistence mechanism provides traceability; it does not by itself establish physical validity.

For production-scale datasets, the current JSON snapshot approach should be replaced or complemented by append-only frame storage/object storage so that every step does not rewrite the entire history.
