/**
 * Causal closed-loop simulation coordinator.
 *
 * Every simulation step follows:
 * sensors -> interlocks/state machine -> actuator commands -> dynamics -> sensors
 *
 * The coordinator is deterministic and pauseable. It is a simulation model, not
 * an industrial control system and must be calibrated against laboratory data
 * before scientific or engineering claims are made from its outputs.
 */

import { ProcessControlLoop, type ProcessControlSnapshot } from './controlLoop';
import { MachineDynamicsEngine, type MachineDynamicsSnapshot } from './machineDynamics';
import { ProcessStateEngine, type MachineSensors, type ProcessState } from './processStateEngine';

export interface ClosedLoopSimulationConfig {
  targetPressureMbar: number;
  targetTemperatureC: number;
  materialWeightKg: number;
  waterContentPercent: number;
  oilContentPercent: number;
  dtSeconds?: number;
  maxSteps?: number;
}

export interface CausalFrame {
  step: number;
  timestampSeconds: number;
  sensorBefore: MachineSensors;
  controller: ProcessState;
  sensorAfter: MachineSensors;
  paused: boolean;
}

export interface ClosedLoopSnapshot {
  stepNumber: number;
  elapsedSeconds: number;
  paused: boolean;
  sensors: MachineSensors;
  state: ProcessState;
  dynamics: MachineDynamicsSnapshot;
  control: ProcessControlSnapshot;
  frames: CausalFrame[];
  pausedSteps: number[];
}

export interface ClosedLoopResult {
  status: ProcessState['stage'];
  frames: CausalFrame[];
  finalSensors: MachineSensors;
  pausedSteps: number[];
}

export class ClosedLoopSimulationEngine {
  private readonly dtSeconds: number;
  private readonly maxSteps: number;
  private readonly state: ProcessStateEngine;
  private readonly dynamics: MachineDynamicsEngine;
  private readonly control: ProcessControlLoop;
  private readonly target: MachineSensors;
  private sensors: MachineSensors;
  private elapsedSeconds = 0;
  private stepNumber = 0;
  private paused = false;
  private readonly frames: CausalFrame[] = [];
  private readonly pausedSteps: number[] = [];

  constructor(config: ClosedLoopSimulationConfig) {
    this.dtSeconds = Math.max(0.1, config.dtSeconds ?? 1);
    this.maxSteps = Math.max(1, config.maxSteps ?? Math.ceil(24 * 3600 / this.dtSeconds));
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
    this.dynamics.restore({ state: this.sensors });
    this.control.reset();
  }

  public step(): CausalFrame | null {
    if (this.paused) { this.pausedSteps.push(this.stepNumber); return null; }
    if (this.stepNumber >= this.maxSteps) return null;

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
    this.elapsedSeconds += this.dtSeconds;
    this.stepNumber += 1;
    this.sensors = sensorAfter;
    const frame: CausalFrame = { step: this.stepNumber, timestampSeconds: this.elapsedSeconds, sensorBefore, controller, sensorAfter: { ...sensorAfter }, paused: false };
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

  public snapshot(): ClosedLoopSnapshot {
    return {
      stepNumber: this.stepNumber,
      elapsedSeconds: this.elapsedSeconds,
      paused: this.paused,
      sensors: { ...this.sensors },
      state: this.state.getSnapshot(),
      dynamics: this.dynamics.getSnapshot(),
      control: this.control.getSnapshot(),
      frames: this.frames.map(frame => ({ ...frame, sensorBefore: { ...frame.sensorBefore }, sensorAfter: { ...frame.sensorAfter }, controller: { ...frame.controller, sensors: { ...frame.controller.sensors }, commands: { ...frame.controller.commands }, interlocks: { ...frame.controller.interlocks } } })),
      pausedSteps: [...this.pausedSteps],
    };
  }

  public restore(snapshot: ClosedLoopSnapshot): void {
    this.stepNumber = snapshot.stepNumber;
    this.elapsedSeconds = snapshot.elapsedSeconds;
    this.paused = snapshot.paused;
    this.sensors = { ...snapshot.sensors };
    this.state.restore(snapshot.state);
    this.dynamics.restore(snapshot.dynamics);
    this.control.restore(snapshot.control);
    this.frames.length = 0;
    this.frames.push(...snapshot.frames.map(frame => ({ ...frame, sensorBefore: { ...frame.sensorBefore }, sensorAfter: { ...frame.sensorAfter }, controller: { ...frame.controller, sensors: { ...frame.controller.sensors }, commands: { ...frame.controller.commands }, interlocks: { ...frame.controller.interlocks } } })));
    this.pausedSteps.length = 0;
    this.pausedSteps.push(...snapshot.pausedSteps);
  }

  public getSnapshot(): ClosedLoopSnapshot { return this.snapshot(); }
  public getFrames(): CausalFrame[] { return [...this.frames]; }
  public getSensors(): MachineSensors { return { ...this.sensors }; }
  public getState(): ProcessState { return this.state.tick(this.sensors, this.elapsedSeconds); }
}
