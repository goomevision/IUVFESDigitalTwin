# Refinement handoff

The current refinement adds a hard causal-frame synchronization gate before any UI claim of synchronization.

The engine contract is now regression-tested. The renderer must still be patched so all animated intensities use `actuatorLevels` from the same `CausalFrame` and ENGINE PROGRESS uses the same frame source.

This is intentionally conservative: no claim is made that a synchronized animation proves thermodynamic correctness.
