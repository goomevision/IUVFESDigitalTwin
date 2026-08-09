export type ProcessLoopState = {
  timeS: number;
  pressureKPa: number;
  temperatureK: number;
  massKg: number;
  quality: number | null;
};

export type ProcessLoopInput = {
  dtS: number;
  state: ProcessLoopState;
  maxDtS?: number;
  step: (state: ProcessLoopState, dtS: number) => ProcessLoopState;
};

/**
 * Deterministic time-step coordinator. Physics modules own the actual state
 * equations; this layer guarantees that simulation time advances explicitly
 * and prevents a single oversized step from silently skipping transients.
 */
export function advanceProcessLoop(input: ProcessLoopInput): ProcessLoopState {
  if (!Number.isFinite(input.dtS) || input.dtS <= 0) {
    throw new Error("dtS must be positive and finite.");
  }
  const maxDtS = input.maxDtS ?? 0.5;
  if (!Number.isFinite(maxDtS) || maxDtS <= 0) {
    throw new Error("maxDtS must be positive and finite.");
  }

  let remaining = input.dtS;
  let state = input.state;
  while (remaining > 0) {
    const stepDt = Math.min(remaining, maxDtS);
    state = input.step(state, stepDt);
    if (!Number.isFinite(state.timeS)) throw new Error("Physics step produced invalid simulation time.");
    state = { ...state, timeS: state.timeS + stepDt };
    remaining -= stepDt;
  }
  return state;
}
