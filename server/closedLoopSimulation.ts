/**
 * Causal closed-loop simulation coordinator.
 *
 * Every interactive step follows sensors -> interlocks/state machine ->
 * controller -> actuator commands -> machine dynamics -> next sensors ->
 * post-dynamics state observation. Interactive steps are wall-clock paced by
 * default so process time cannot be skipped accidentally. Batch completion
 * intentionally bypasses wall-clock pacing and remains available for
 * deterministic offline computation.
 */

import { ProcessControlLoop, type ProcessControlSnapshot } from './controlLoop';
import { MachineDynamicsEngine, type MachineDynamicsSnapshot, type VirtualHardwareDynamicsConfig } from './machineDynamics';
import { ProcessStateEngine, type MachineSensors, type ProcessState } from './processStateEngine';
import { evaluateSafety, type SafetyEvaluation, type SafetyLimits } from './safetyKernel';
import { buildSafetyEventTimeline, type SafetyEvent } from './safetyEventTimeline';

export interface ClosedLoopSimulationConfig {
  targetPressureMbar: number;
  targetTemperatureC: number;
  materialWeightKg: number;
  waterContentPercent: number;
  oilContentPercent: number;
  dtSeconds?: number;
  maxSteps?: number;
  realTime?: boolean;
  hardware?: VirtualHardwareDynamicsConfig;
  safetyLimits?: Partial<SafetyLimits>;
}

export interface CausalFrame {
  step: number;
  timestampSeconds: number;
  wallClockTimestampMs?: number;
  wallClockDeltaMs?: number;
  sensorBefore: MachineSensors;
  controller: ProcessState;
  sensorAfter: MachineSensors;
  stateAfter?: ProcessState;
  safety: SafetyEvaluation;
  paused: boolean;
}

export interface ClosedLoopResult {
  status: ProcessState['stage'];
  frames: CausalFrame[];
  finalSensors: MachineSensors;
  pausedSteps: number[];
  safetyEvents: SafetyEvent[];
}

export interface ClosedLoopSnapshot {
  version: 1;
  config: ClosedLoopSimulationConfig;
  target: MachineSensors;
  sensors: MachineSensors;
  elapsedSeconds: number;
  stepNumber: number;
  paused: boolean;
  lastStepWallClockMs?: number;
  state: ProcessState;
  dynamics: MachineDynamicsSnapshot;
  control: ProcessControlSnapshot;
  frames: CausalFrame[];
  pausedSteps: number[];
}

export class ClosedLoopSimulationEngine {
  private readonly dtSeconds: number;
  private readonly maxSteps: number;
  private readonly realTime: boolean;
  private readonly state: ProcessStateEngine;
  private readonly dynamics: MachineDynamicsEngine;
  private readonly control: ProcessControlLoop;
  private readonly target: MachineSensors;
  private readonly safetyLimits: Partial<SafetyLimits>;
  private sensors: MachineSensors;
  private elapsedSeconds = 0;
  private stepNumber = 0;
  private paused = false;
  private lastStepWallClockMs: number | undefined;
  private readonly frames: CausalFrame[] = [];
  private readonly pausedSteps: number[] = [];

  constructor(private readonly config: ClosedLoopSimulationConfig) {
    this.dtSeconds = Math.max(0.1, config.dtSeconds ?? 1);
    this.maxSteps = Math.max(1, config.maxSteps ?? Math.ceil(24 * 3600 / this.dtSeconds));
    this.realTime = config.realTime ?? true;
    this.safetyLimits = { ...config.safetyLimits };
    this.target = {
      chamberSealed: true,
      pressureMbar: Math.max(1, config.targetPressureMbar),
      temperatureC: Math.max(25, config.targetTemperatureC),
      yieldPercent: 100,
      waterRemovedKg: Math.max(0, config.materialWeightKg * config.waterContentPercent / 100),
      oilRecoveredKg: Math.max(0, config.materialWeightKg * config.oilContentPercent / 100),
      energyKwh: 0,
    };
    this.sensors = {
      chamberSealed: true,
      pressureMbar: 1013.25,
      temperatureC: 25,
      yieldPercent: 0,
      waterRemovedKg: 0,
      oilRecoveredKg: 0,
      energyKwh: 0,
      collectionVesselMassKg: [0, 0, 0, 0],
      unroutedCondensateKg: 0,
      collectionRoutingStatus: 'ROUTED',
    };
    this.state = new ProcessStateEngine(
      {
        targetPressureMbar: config.targetPressureMbar,
        targetTemperatureC: config.targetTemperatureC,
        ...config.safetyLimits,
      },
      this.sensors,
    );
    this.dynamics = new MachineDynamicsEngine(this.sensors, {
      ambientPressureMbar: 1013.25,
      ambientTemperatureC: 25,
      vacuumRateMbarPerSecond: 7,
      heaterRateCPerSecond: 0.18,
      passiveHeatLossCPerSecond: 0.035,
      coolingRateCPerSecond: 0.12,
      condenserCoolingFactor: 0.05,
      extractionYieldRatePerSecond: 0.00035,
      actuatorLag: 0.35,
      ...config.hardware,
    });
    this.control = new ProcessControlLoop();
  }

  public isPaused(): boolean { return this.paused; }
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; this.lastStepWallClockMs = Date.now(); }

  public reset(): void {
    this.paused = false;
    this.elapsedSeconds = 0;
    this.stepNumber = 0;
    this.lastStepWallClockMs = undefined;
    this.frames.length = 0;
    this.pausedSteps.length = 0;
    this.sensors = {
      chamberSealed: true,
      pressureMbar: 1013.25,
      temperatureC: 25,
      yieldPercent: 0,
      waterRemovedKg: 0,
      oilRecoveredKg: 0,
      energyKwh: 0,
      collectionVesselMassKg: [0, 0, 0, 0],
      unroutedCondensateKg: 0,
      collectionRoutingStatus: 'ROUTED',
    };
    this.state.reset(this.sensors);
    this.control.reset();
    this.dynamics.restore({ state: { ...this.sensors }, config: { ...this.dynamics.snapshot().config } });
  }

  /** Interactive step. In REAL_TIME mode, one simulation dt must be backed by the same wall-clock duration. */
  public step(): CausalFrame | null {
    const currentStage = this.state.snapshotState().stage;
    if (this.paused || this.stepNumber >= this.maxSteps || currentStage === 'COMPLETE' || currentStage === 'FAULT') {
      if (this.paused) this.pausedSteps.push(this.stepNumber);
      return null;
    }
    const now = Date.now();
    const requiredWallClockMs = this.dtSeconds * 1000;
    if (this.realTime && this.lastStepWallClockMs !== undefined && now - this.lastStepWallClockMs < requiredWallClockMs) return null;
    return this.advanceStep(now);
  }

  private advanceStep(now: number): CausalFrame {
    const sensorBefore = { ...this.sensors };
    const controllerBeforeActuation = this.state.tick(this.sensors, this.elapsedSeconds);
    const controlOutput = this.control.update({
      targetTemperatureC: this.target.temperatureC,
      targetPressureMbar: this.target.pressureMbar,
      temperatureC: this.sensors.temperatureC,
      pressureMbar: this.sensors.pressureMbar,
      stage: controllerBeforeActuation.stage,
      dtSeconds: this.dtSeconds,
    });
    const commands = {
      ...controllerBeforeActuation.commands,
      heater: controlOutput.heaterPower > 0.01,
      vacuumPump: controlOutput.vacuumPumpPower > 0.01,
      condenser: controlOutput.valve.vaporToCondenser > 0.01,
      cooling: controlOutput.valve.coolingWater > 0.01,
    };
    const controller = { ...controllerBeforeActuation, commands };
    const sensorAfter = this.dynamics.step(this.target, commands, this.dtSeconds);
    const previousWallClockMs = this.lastStepWallClockMs;
    this.elapsedSeconds += this.dtSeconds;
    this.stepNumber += 1;
    this.sensors = sensorAfter;
    this.lastStepWallClockMs = now;

    const safety = evaluateSafety(sensorBefore, sensorAfter, this.dtSeconds, this.safetyLimits);
    const stateAfter = this.state.tick(this.sensors, this.elapsedSeconds);
    const frame: CausalFrame = {
      step: this.stepNumber,
      timestampSeconds: this.elapsedSeconds,
      wallClockTimestampMs: now,
      wallClockDeltaMs: previousWallClockMs === undefined ? undefined : now - previousWallClockMs,
      sensorBefore,
      controller,
      sensorAfter: { ...sensorAfter },
      stateAfter,
      safety,
      paused: false,
    };
    this.frames.push(frame);
    return frame;
  }

  /** Offline deterministic completion. This intentionally does not wait for wall-clock time. */
  public runToCompletion(): ClosedLoopResult {
    while (this.stepNumber < this.maxSteps) {
      const currentState = this.state.snapshotState();
      if (currentState.stage === 'COMPLETE' || currentState.stage === 'FAULT') break;
      this.advanceStep(Date.now());
    }
    const finalState = this.state.snapshotState();
    return {
      status: finalState.stage,
      frames: [...this.frames],
      finalSensors: { ...this.sensors },
      pausedSteps: [...this.pausedSteps],
      safetyEvents: buildSafetyEventTimeline(this.frames),
    };
  }

  public getFrames(): CausalFrame[] { return [...this.frames]; }
  public getSensors(): MachineSensors { return { ...this.sensors }; }
  public getState(): ProcessState { return this.state.snapshotState(); }
  public getSafetyEvents(): SafetyEvent[] { return buildSafetyEventTimeline(this.frames); }

  public snapshot(): ClosedLoopSnapshot {
    return {
      version: 1,
      config: { ...this.config, realTime: this.realTime, hardware: this.config.hardware ? { ...this.config.hardware } : undefined },
      target: { ...this.target },
      sensors: { ...this.sensors },
      elapsedSeconds: this.elapsedSeconds,
      stepNumber: this.stepNumber,
      paused: this.paused,
      lastStepWallClockMs: this.lastStepWallClockMs,
      state: this.state.snapshotState(),
      dynamics: this.dynamics.snapshot(),
      control: this.control.snapshot(),
      frames: [...this.frames],
      pausedSteps: [...this.pausedSteps],
    };
  }

  public restore(snapshot: ClosedLoopSnapshot): void {
    if (snapshot.version !== 1) throw new Error(`Unsupported simulation snapshot version: ${snapshot.version}`);
    const snapshotRealTime = snapshot.config.realTime ?? true;
    if (snapshotRealTime !== this.realTime) throw new Error('Snapshot real-time mode does not match simulation configuration');
    if (
      snapshot.config.targetPressureMbar !== this.config.targetPressureMbar ||
      snapshot.config.targetTemperatureC !== this.config.targetTemperatureC ||
      snapshot.config.materialWeightKg !== this.config.materialWeightKg ||
      snapshot.config.waterContentPercent !== this.config.waterContentPercent ||
      snapshot.config.oilContentPercent !== this.config.oilContentPercent
    ) throw new Error('Snapshot configuration does not match simulation configuration');

    const snapshotHardware = snapshot.config.hardware ?? {};
    const currentHardware = this.config.hardware ?? {};
    const hardwareKeys: Array<keyof VirtualHardwareDynamicsConfig> = [
      'reactorInternalDiameterMm',
      'reactorShellLengthMm',
      'reactorWallThicknessMm',
      'reactorHeadThicknessMm',
      'reactorMaterial',
      'designExternalPressureBar',
      'designTemperatureC',
      'ultrasonicFrequencyKHz',
      'ultrasonicMaxPowerKW',
      'ultrasonicOperatingFrequencyKHz',
      'ultrasonicRequestedPowerKW',
      'coldTrapTemperaturesC',
      'coldTrapHeatTransferCoefficientWPerM2K',
      'coldTrapHeatTransferAreasM2',
      'coldTrapVolumesL',
      'coldTrapCondensateCapacityKg',
      'collectionVesselCapacityKg',
      'oilCollectionRoutingFractions',
      'chamberVolumeL',
      'vacuumPipeDiameterMm',
      'vacuumPipeLengthM',
      'vacuumPipeEffectiveLengthFactor',
      'vacuumGasViscosityPaS',
      'vacuumPumpOutletPressureMbar',
      'pumpCapacityM3h',
      'thermalMassKJPerC',
      'heatingPowerKW',
      'coolingPowerKW',
      'leakRateMbarPerSecond',
      'effectiveHeatLossKWPerC',
    ];
    for (const key of hardwareKeys) {
      if (JSON.stringify(snapshotHardware[key]) !== JSON.stringify(currentHardware[key])) {
        throw new Error('Snapshot hardware profile does not match simulation configuration');
      }
    }

    this.sensors = { ...snapshot.sensors };
    this.elapsedSeconds = snapshot.elapsedSeconds;
    this.stepNumber = snapshot.stepNumber;
    this.paused = snapshot.paused;
    this.lastStepWallClockMs = this.realTime && !this.paused ? Date.now() : snapshot.lastStepWallClockMs;
    this.frames.length = 0;
    this.frames.push(...snapshot.frames);
    this.pausedSteps.length = 0;
    this.pausedSteps.push(...snapshot.pausedSteps);
    this.state.restore(snapshot.state);
    this.dynamics.restore(snapshot.dynamics);
    this.control.restore(snapshot.control);
  }
}
