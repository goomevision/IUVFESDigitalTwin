export type ProcessState = {
  temperatureC: number;
  pressureKPaAbs: number;
  massKg: number;
  energyJ: number;
};

export type OperatorCommand = {
  id: string;
  physicalTimeS: number;
  targetTemperatureC?: number;
  targetPressureKPaAbs?: number;
  heaterPowerW?: number;
};

export type PhysicalLimits = {
  maxTemperatureC: number;
  minPressureKPaAbs: number;
  maxTemperatureRateCPerS: number;
  maxPressureRateKPaPerS: number;
  maxHeaterPowerW: number;
};

export type TimelineSample = {
  physicalTimeS: number;
  computationStepS: number;
  state: ProcessState;
  commandId?: string;
  target?: Partial<ProcessState>;
  rates: { temperatureCPerS: number; pressureKPaPerS: number; massKgPerS: number };
  warnings: string[];
};

export type TimelineResult = {
  samples: TimelineSample[];
  events: Array<{ type: "COMMAND" | "LIMIT"; physicalTimeS: number; id: string; message: string }>;
};

export type ProcessDynamics = (state: ProcessState, command: OperatorCommand | undefined, dtS: number) => ProcessState;

function finiteState(state: ProcessState): void {
  if (![state.temperatureC, state.pressureKPaAbs, state.massKg, state.energyJ].every(Number.isFinite)) {
    throw new Error("Process state contains non-finite values.");
  }
}

/**
 * Records physical time separately from computational time. The dynamics
 * callback is authoritative: this timeline does not teleport state variables
 * to operator setpoints.
 */
export function simulatePhysicalTimeline(
  initialState: ProcessState,
  commands: OperatorCommand[],
  limits: PhysicalLimits,
  dynamics: ProcessDynamics,
  endTimeS: number,
  initialStepS = 1,
): TimelineResult {
  if (endTimeS <= 0 || initialStepS <= 0) throw new Error("Simulation horizon and timestep must be positive.");
  finiteState(initialState);

  const sortedCommands = [...commands].sort((a, b) => a.physicalTimeS - b.physicalTimeS);
  const samples: TimelineSample[] = [];
  const events: TimelineResult["events"] = [];
  let state = { ...initialState };
  let t = 0;
  let dt = initialStepS;
  let commandIndex = 0;
  let previous = { ...state };

  while (t < endTimeS) {
    while (commandIndex < sortedCommands.length && sortedCommands[commandIndex].physicalTimeS <= t) {
      const command = sortedCommands[commandIndex];
      events.push({ type: "COMMAND", physicalTimeS: command.physicalTimeS, id: command.id, message: "Operator command applied to the control model." });
      commandIndex += 1;
    }

    const command = commandIndex > 0 ? sortedCommands[commandIndex - 1] : undefined;
    const step = Math.min(dt, endTimeS - t);
    const next = dynamics(state, command, step);
    finiteState(next);

    const rates = {
      temperatureCPerS: (next.temperatureC - state.temperatureC) / step,
      pressureKPaPerS: (next.pressureKPaAbs - state.pressureKPaAbs) / step,
      massKgPerS: (next.massKg - state.massKg) / step,
    };

    const warnings: string[] = [];
    if (Math.abs(rates.temperatureCPerS) > limits.maxTemperatureRateCPerS) warnings.push("TEMPERATURE_RAMP_LIMIT_EXCEEDED");
    if (Math.abs(rates.pressureKPaPerS) > limits.maxPressureRateKPaPerS) warnings.push("PRESSURE_TRANSIENT_LIMIT_EXCEEDED");
    if (next.temperatureC > limits.maxTemperatureC) warnings.push("MAX_TEMPERATURE_LIMIT_EXCEEDED");
    if (next.pressureKPaAbs < limits.minPressureKPaAbs) warnings.push("MIN_PRESSURE_LIMIT_EXCEEDED");
    if (command?.heaterPowerW !== undefined && command.heaterPowerW > limits.maxHeaterPowerW) warnings.push("HEATER_POWER_LIMIT_EXCEEDED");

    if (warnings.length > 0) {
      for (const warning of warnings) events.push({ type: "LIMIT", physicalTimeS: t + step, id: warning, message: warning });
      dt = Math.max(step / 10, 1e-6);
    } else {
      const maxRateRatio = Math.max(
        Math.abs(rates.temperatureCPerS) / Math.max(limits.maxTemperatureRateCPerS, 1e-12),
        Math.abs(rates.pressureKPaPerS) / Math.max(limits.maxPressureRateKPaPerS, 1e-12),
      );
      if (maxRateRatio < 0.1) dt = Math.min(dt * 2, initialStepS * 100);
      else if (maxRateRatio > 0.8) dt = Math.max(dt / 2, 1e-6);
    }

    t += step;
    samples.push({
      physicalTimeS: t,
      computationStepS: step,
      state: next,
      commandId: command?.id,
      target: command ? { temperatureC: command.targetTemperatureC, pressureKPaAbs: command.targetPressureKPaAbs } : undefined,
      rates,
      warnings,
    });
    previous = state;
    state = next;
  }

  void previous;
  return { samples, events };
}
