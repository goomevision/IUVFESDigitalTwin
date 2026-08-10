/**
 * Causal closed-loop simulation coordinator.
 *
 * Every simulation step follows sensors -> interlocks/state machine ->
 * controller -> actuator commands -> machine dynamics -> next sensors.
 * This is a deterministic simulation model and requires laboratory calibration
 * before scientific or engineering claims are made from its outputs.
 */

import { ProcessControlLoop, type ProcessControlSnapshot } from './controlLoop';
import { MachineDynamicsEngine, type MachineDynamicsSnapshot } from './machineDynamics';
import { ProcessStateEngine, type MachineSensors, type ProcessState } from './processStateEngine';
import type { UltrasonicConfig, UltrasonicState } from './ultrasonicEngine';

export interface ClosedLoopSimulationConfig {
  targetPressureMbar: number;
  targetTemperatureC: number;
  materialWeightKg: number;
  waterContentPercent: number;
  oilContentPercent: number;
  dtSeconds?: number;
  maxSteps?: number;
  ultrasonic?: UltrasonicConfig;
}

export interface MaterialInventory {
  initialMassKg: number;
  waterInitialKg: number;
  waterRemovedKg: number;
  oilPotentialKg: number;
  oilRecoveredKg: number;
  recoveryPercent: number;
}

export interface CausalFrame {
  step: number;
  timestampSeconds: number;
  sensorBefore: MachineSensors;
  controller: ProcessState;
  intendedCommands: ProcessState['commands'];
  effectiveCommands: ProcessState['commands'];
  physicalSensorAfter: MachineSensors;
  sensorAfter: MachineSensors;
  materialInventory: MaterialInventory;
  ultrasonic: UltrasonicState | null;
  paused: boolean;
}

export interface ClosedLoopResult {
  status: ProcessState['stage'];
  frames: CausalFrame[];
  finalSensors: MachineSensors;
  pausedSteps: number[];
}

export interface ClosedLoopSnapshot {
  version: 1;
  config: ClosedLoopSimulationConfig;
  target: MachineSensors;
  sensors: MachineSensors;
  elapsedSeconds: number;
  stepNumber: number;
  paused: boolean;
  state: ProcessState;
  dynamics: MachineDynamicsSnapshot;
  control: ProcessControlSnapshot;
  frames: CausalFrame[];
  pausedSteps: number[];
}

export class ClosedLoopSimulationEngine {
  private readonly dtSeconds: number;
  private readonly maxSteps: number;
  private readonly state: ProcessStateEngine;
  private readonly dynamics: MachineDynamicsEngine;
  private readonly control: ProcessControlLoop;
  private readonly target: MachineSensors;
  private readonly material: { initialMassKg: number; waterInitialKg: number; oilPotentialKg: number };
  private sensors: MachineSensors;
  private elapsedSeconds = 0;
  private stepNumber = 0;
  private paused = false;
  private readonly frames: CausalFrame[] = [];
  private readonly pausedSteps: number[] = [];

  constructor(private readonly config: ClosedLoopSimulationConfig) {
    this.dtSeconds = Math.max(0.1, config.dtSeconds ?? 1);
    this.maxSteps = Math.max(1, config.maxSteps ?? Math.ceil(24 * 3600 / this.dtSeconds));
    const waterInitialKg = Math.max(0, config.materialWeightKg * config.waterContentPercent / 100);
    const oilPotentialKg = Math.max(0, config.materialWeightKg * config.oilContentPercent / 100);
    this.material = { initialMassKg: Math.max(0, config.materialWeightKg), waterInitialKg, oilPotentialKg };
    this.target = {
      chamberSealed: true,
      pressureMbar: Math.max(1, config.targetPressureMbar),
      temperatureC: Math.max(25, config.targetTemperatureC),
      yieldPercent: 100,
      waterRemovedKg: waterInitialKg,
      oilRecoveredKg: oilPotentialKg,
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
    };
    this.state = new ProcessStateEngine({ targetPressureMbar: config.targetPressureMbar, targetTemperatureC: config.targetTemperatureC }, this.sensors);
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
      ultrasonic: config.ultrasonic,
    });
    this.control = new ProcessControlLoop();
  }

  public isPaused(): boolean { return this.paused; }
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }

  public reset(): void {
    this.paused = false;
    this.elapsedSeconds = 0;
    this.stepNumber = 0;
    this.frames.length = 0;
    this.pausedSteps.length = 0;
    this.sensors = { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 };
    this.state.reset(this.sensors);
    this.control.reset();
    this.dynamics.restore({ state: this.sensors });
  }

  public step(): CausalFrame | null {
    if (this.paused || this.stepNumber >= this.maxSteps) {
      if (this.paused) this.pausedSteps.push(this.stepNumber);
      return null;
    }

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
    const intendedCommands = { ...commands };
    const effectiveCommands = controller.stage === 'FAULT'
      ? { vacuumPump: false, heater: false, extractor: false, condenser: false, cooling: true }
      : { ...commands };
    const ultrasonic = this.dynamics.getUltrasonicState(this.sensors.pressureMbar);
    const physicalSensorAfter = this.dynamics.step(this.target, effectiveCommands, this.dtSeconds);
    this.elapsedSeconds += this.dtSeconds;
    this.stepNumber += 1;
    this.sensors = physicalSensorAfter;
    const controllerAfterActuation = this.state.tick(this.sensors, this.elapsedSeconds);
    const materialInventory: MaterialInventory = {
      initialMassKg: this.material.initialMassKg,
      waterInitialKg: this.material.waterInitialKg,
      waterRemovedKg: Math.min(this.material.waterInitialKg, Math.max(0, this.sensors.waterRemovedKg)),
      oilPotentialKg: this.material.oilPotentialKg,
      oilRecoveredKg: Math.min(this.material.oilPotentialKg, Math.max(0, this.sensors.oilRecoveredKg)),
      recoveryPercent: this.material.oilPotentialKg > 0 ? this.sensors.oilRecoveredKg / this.material.oilPotentialKg * 100 : 0,
    };
    const frame: CausalFrame = {
      step: this.stepNumber,
      timestampSeconds: this.elapsedSeconds,
      sensorBefore,
      controller: controllerAfterActuation,
      intendedCommands,
      effectiveCommands,
      physicalSensorAfter: { ...physicalSensorAfter },
      sensorAfter: { ...physicalSensorAfter },
      materialInventory,
      ultrasonic,
      paused: false,
    };
    this.frames.push(frame);
    return frame;
  }

  public runToCompletion(): ClosedLoopResult {
    while (this.stepNumber < this.maxSteps) {
      const currentState = this.state.tick(this.sensors, this.elapsedSeconds);
      if (currentState.stage === 'COMPLETE' || currentState.stage === 'FAULT') break;
      if (this.step() === null) break;
    }
    const finalState = this.state.tick(this.sensors, this.elapsedSeconds);
    return { status: finalState.stage, frames: [...this.frames], finalSensors: { ...this.sensors }, pausedSteps: [...this.pausedSteps] };
  }

  public getFrames(): CausalFrame[] { return [...this.frames]; }
  public getSensors(): MachineSensors { return { ...this.sensors }; }
  public getState(): ProcessState { return this.state.tick(this.sensors, this.elapsedSeconds); }

  public snapshot(): ClosedLoopSnapshot {
    return {
      version: 1,
      config: { ...this.config },
      target: { ...this.target },
      sensors: { ...this.sensors },
      elapsedSeconds: this.elapsedSeconds,
      stepNumber: this.stepNumber,
      paused: this.paused,
      state: this.state.snapshotState(),
      dynamics: this.dynamics.snapshot(),
      control: this.control.snapshot(),
      frames: [...this.frames],
      pausedSteps: [...this.pausedSteps],
    };
  }

  public restore(snapshot: ClosedLoopSnapshot): void {
    if (snapshot.version !== 1) throw new Error(`Unsupported simulation snapshot version: ${snapshot.version}`);
    this.sensors = { ...snapshot.sensors };
    this.elapsedSeconds = snapshot.elapsedSeconds;
    this.stepNumber = snapshot.stepNumber;
    this.paused = snapshot.paused;
    this.frames.length = 0;
    this.frames.push(...snapshot.frames);
    this.pausedSteps.length = 0;
    this.pausedSteps.push(...snapshot.pausedSteps);
    this.state.restore(snapshot.state);
    this.dynamics.restore(snapshot.dynamics);
    this.control.restore(snapshot.control);
  }
}
