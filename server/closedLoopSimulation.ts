/**
 * Causal closed-loop simulation coordinator.
 *
 * Every simulation step follows:
 * sensors -> interlocks/state machine -> actuator commands -> dynamics -> sensors
 *
 * The ultrasonic channel is an explicitly labelled experimental model. Its
 * outputs are simulation data and must be calibrated against laboratory data.
 */

import { ProcessControlLoop, type ProcessControlSnapshot, type ControlOutput, type OperatorActuatorLimits } from './controlLoop';
import { MachineDynamicsEngine, type MachineDynamicsSnapshot } from './machineDynamics';
import { ProcessStateEngine, type MachineSensors, type ProcessState } from './processStateEngine';
import { evaluateUltrasonic, type UltrasonicConfig, type UltrasonicExperimentalFrame } from './ultrasonicExperimentalModel';

export interface ClosedLoopSimulationConfig { targetPressureMbar: number; targetTemperatureC: number; coolingTemperatureC?: number; materialWeightKg: number; waterContentPercent: number; oilContentPercent: number; dtSeconds?: number; maxSteps?: number; ultrasonic?: UltrasonicConfig; }
export interface MaterialInventory { initialMassKg: number; remainingMassKg: number; waterInitialKg: number; waterRemovedKg: number; waterRemainingKg: number; oilPotentialKg: number; oilRecoveredKg: number; oilRemainingPotentialKg: number; recoveryPercent: number; }
export interface SafetyFrame { stage: ProcessState['stage']; allSystemsSafe: boolean; chamberSealed: boolean; pressureSafeForHeating: boolean; temperatureSafeForCooling: boolean; vacuumAchieved: boolean; overTemperature: boolean; alarm: string | null; transitionReason: string; }
export interface CausalFrame { step: number; timestampSeconds: number; sensorBefore: MachineSensors; controller: ProcessState; controlOutput: ControlOutput; intendedCommands: ProcessState['commands']; effectiveCommands: ProcessState['commands']; physicalSensorAfter: MachineSensors; sensorAfter: MachineSensors; materialInventory: MaterialInventory; safety: SafetyFrame; ultrasonic: UltrasonicExperimentalFrame; paused: boolean; }
export interface ClosedLoopSnapshot { stepNumber: number; elapsedSeconds: number; paused: boolean; sensors: MachineSensors; state: ProcessState; dynamics: MachineDynamicsSnapshot; control: ProcessControlSnapshot; targets: { targetPressureMbar: number; targetTemperatureC: number; coolingTemperatureC: number }; ultrasonic: UltrasonicConfig; frames: CausalFrame[]; pausedSteps: number[]; }
export interface ClosedLoopResult { status: ProcessState['stage']; frames: CausalFrame[]; finalSensors: MachineSensors; pausedSteps: number[]; }
const DEFAULT_COOLING_C = 35;

export class ClosedLoopSimulationEngine {
  private readonly dtSeconds: number; private readonly maxSteps: number; private readonly state: ProcessStateEngine; private readonly dynamics: MachineDynamicsEngine; private readonly control: ProcessControlLoop; private readonly target: MachineSensors;
  private readonly material: { initialMassKg: number; waterInitialKg: number; oilPotentialKg: number };
  private coolingTemperatureC: number; private ultrasonicConfig: UltrasonicConfig; private sensors: MachineSensors; private elapsedSeconds = 0; private stepNumber = 0; private paused = false; private readonly frames: CausalFrame[] = []; private readonly pausedSteps: number[] = [];
  constructor(config: ClosedLoopSimulationConfig) {
    this.dtSeconds = Math.max(0.1, config.dtSeconds ?? 1); this.maxSteps = Math.max(1, config.maxSteps ?? Math.ceil(24 * 3600 / this.dtSeconds));
    const waterInitialKg = Math.max(0, config.materialWeightKg * config.waterContentPercent / 100); const oilPotentialKg = Math.max(0, config.materialWeightKg * config.oilContentPercent / 100);
    this.material = { initialMassKg: Math.max(0, config.materialWeightKg), waterInitialKg, oilPotentialKg };
    this.coolingTemperatureC = Math.max(25, Math.min(80, config.coolingTemperatureC ?? DEFAULT_COOLING_C));
    this.ultrasonicConfig = { ...(config.ultrasonic ?? {}) };
    this.target = { chamberSealed: true, pressureMbar: Math.max(1, config.targetPressureMbar), temperatureC: Math.max(25, config.targetTemperatureC), yieldPercent: 100, waterRemovedKg: waterInitialKg, oilRecoveredKg: oilPotentialKg, energyKwh: 0 };
    this.sensors = { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 };
    this.state = new ProcessStateEngine({ targetPressureMbar: this.target.pressureMbar, targetTemperatureC: this.target.temperatureC, coolingTemperatureC: this.coolingTemperatureC }, this.sensors);
    this.dynamics = new MachineDynamicsEngine(this.sensors, { ambientPressureMbar: 1013.25, ambientTemperatureC: 25, vacuumRateMbarPerSecond: 7, heaterRateCPerSecond: 0.18, passiveHeatLossCPerSecond: 0.035, coolingRateCPerSecond: 0.12, condenserCoolingFactor: 0.05, extractionYieldRatePerSecond: 0.00035, actuatorLag: 0.35 });
    this.control = new ProcessControlLoop();
  }
  public isPaused(): boolean { return this.paused; }
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public setTargets(next: { targetPressureMbar?: number; targetTemperatureC?: number; coolingTemperatureC?: number }): void { if (next.targetPressureMbar !== undefined) this.target.pressureMbar = Math.max(1, Math.min(1000, next.targetPressureMbar)); if (next.targetTemperatureC !== undefined) this.target.temperatureC = Math.max(25, Math.min(150, next.targetTemperatureC)); if (next.coolingTemperatureC !== undefined) this.coolingTemperatureC = Math.max(25, Math.min(80, next.coolingTemperatureC)); this.state.setTargets({ targetPressureMbar: this.target.pressureMbar, targetTemperatureC: this.target.temperatureC, coolingTemperatureC: this.coolingTemperatureC }); }
  public getTargets(): { targetPressureMbar: number; targetTemperatureC: number; coolingTemperatureC: number } { return { targetPressureMbar: this.target.pressureMbar, targetTemperatureC: this.target.temperatureC, coolingTemperatureC: this.coolingTemperatureC }; }
  public setOperatorLimits(next: Partial<OperatorActuatorLimits>): void { this.control.setOperatorLimits(next); }
  public getOperatorLimits(): OperatorActuatorLimits { return this.control.getOperatorLimits(); }
  public setUltrasonicControl(next: Partial<UltrasonicConfig>): void { this.ultrasonicConfig = { ...this.ultrasonicConfig, ...next }; }
  public getUltrasonicControl(): UltrasonicConfig { return { ...this.ultrasonicConfig }; }
  public reset(): void { this.paused = false; this.elapsedSeconds = 0; this.stepNumber = 0; this.frames.length = 0; this.pausedSteps.length = 0; this.sensors = { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 }; this.state.reset(this.sensors); this.dynamics.restore({ state: this.sensors }); this.control.reset(); }
  public step(): CausalFrame | null {
    if (this.paused) { this.pausedSteps.push(this.stepNumber); return null; } if (this.stepNumber >= this.maxSteps) return null;
    const sensorBefore = { ...this.sensors }; const controllerBeforeActuation = this.state.tick(this.sensors, this.elapsedSeconds);
    const controlOutput = this.control.update({ targetTemperatureC: this.target.temperatureC, targetPressureMbar: this.target.pressureMbar, temperatureC: this.sensors.temperatureC, pressureMbar: this.sensors.pressureMbar, stage: controllerBeforeActuation.stage, dtSeconds: this.dtSeconds });
    const commands = { ...controllerBeforeActuation.commands, heater: controlOutput.heaterPower > 0.01, vacuumPump: controlOutput.vacuumPumpPower > 0.01, condenser: controlOutput.valve.vaporToCondenser > 0.01, cooling: controlOutput.valve.coolingWater > 0.01 };
    const controller = { ...controllerBeforeActuation, commands }; const intendedCommands = { ...commands }; const effectiveCommands = controller.stage === 'FAULT' ? { vacuumPump: false, heater: false, extractor: false, condenser: false, cooling: true } : { ...commands };
    const ultrasonic = evaluateUltrasonic(this.ultrasonicConfig);
    const physicalSensorAfter = this.dynamics.step(this.target, effectiveCommands, this.dtSeconds, ultrasonic.massTransferMultiplier); this.elapsedSeconds += this.dtSeconds; this.stepNumber += 1; this.sensors = physicalSensorAfter;
    const controllerAfterActuation = this.state.tick(this.sensors, this.elapsedSeconds); const materialInventory = this.buildMaterialInventory(this.sensors); const safety = this.buildSafetyFrame(controllerAfterActuation);
    const frame: CausalFrame = { step: this.stepNumber, timestampSeconds: this.elapsedSeconds, sensorBefore, controller: controllerAfterActuation, controlOutput, intendedCommands, effectiveCommands, physicalSensorAfter: { ...physicalSensorAfter }, sensorAfter: { ...physicalSensorAfter }, materialInventory, safety, ultrasonic, paused: false }; this.frames.push(frame); return frame;
  }
  public runToCompletion(): ClosedLoopResult { while (this.stepNumber < this.maxSteps) { const currentState = this.state.tick(this.sensors, this.elapsedSeconds); if (currentState.stage === 'COMPLETE' || currentState.stage === 'FAULT') break; if (this.step() === null) break; } const finalState = this.state.tick(this.sensors, this.elapsedSeconds); return { status: finalState.stage, frames: [...this.frames], finalSensors: { ...this.sensors }, pausedSteps: [...this.pausedSteps] }; }
  public snapshot(): ClosedLoopSnapshot { return { stepNumber: this.stepNumber, elapsedSeconds: this.elapsedSeconds, paused: this.paused, sensors: { ...this.sensors }, state: this.state.getSnapshot(), dynamics: this.dynamics.getSnapshot(), control: this.control.getSnapshot(), targets: this.getTargets(), ultrasonic: this.getUltrasonicControl(), frames: this.frames.map(frame => ({ ...frame, sensorBefore: { ...frame.sensorBefore }, sensorAfter: { ...frame.sensorAfter }, physicalSensorAfter: { ...frame.physicalSensorAfter }, controller: { ...frame.controller, sensors: { ...frame.controller.sensors }, commands: { ...frame.controller.commands }, interlocks: { ...frame.controller.interlocks } }, controlOutput: { ...frame.controlOutput, valve: { ...frame.controlOutput.valve } }, intendedCommands: { ...frame.intendedCommands }, effectiveCommands: { ...frame.effectiveCommands }, materialInventory: { ...frame.materialInventory }, safety: { ...frame.safety }, ultrasonic: { ...frame.ultrasonic } })), pausedSteps: [...this.pausedSteps] }; }
  public restore(snapshot: ClosedLoopSnapshot): void { this.stepNumber = snapshot.stepNumber; this.elapsedSeconds = snapshot.elapsedSeconds; this.paused = snapshot.paused; this.sensors = { ...snapshot.sensors }; this.state.restore(snapshot.state); this.dynamics.restore(snapshot.dynamics); this.control.restore(snapshot.control); if (snapshot.targets) { this.target.pressureMbar = snapshot.targets.targetPressureMbar; this.target.temperatureC = snapshot.targets.targetTemperatureC; this.coolingTemperatureC = snapshot.targets.coolingTemperatureC; this.state.setTargets(snapshot.targets); } this.ultrasonicConfig = { ...(snapshot.ultrasonic ?? {}) }; this.frames.length = 0; this.frames.push(...snapshot.frames.map(frame => ({ ...frame, sensorBefore: { ...frame.sensorBefore }, sensorAfter: { ...frame.sensorAfter }, physicalSensorAfter: { ...frame.physicalSensorAfter }, controller: { ...frame.controller, sensors: { ...frame.controller.sensors }, commands: { ...frame.controller.commands }, interlocks: { ...frame.controller.interlocks } }, controlOutput: { ...frame.controlOutput, valve: { ...frame.controlOutput.valve } }, intendedCommands: { ...frame.intendedCommands }, effectiveCommands: { ...frame.effectiveCommands }, materialInventory: { ...frame.materialInventory }, safety: { ...frame.safety }, ultrasonic: frame.ultrasonic ?? evaluateUltrasonic(snapshot.ultrasonic ?? {}) }))); this.pausedSteps.length = 0; this.pausedSteps.push(...snapshot.pausedSteps); }
  public getSnapshot(): ClosedLoopSnapshot { return this.snapshot(); }
  public getFrames(): CausalFrame[] { return [...this.frames]; }
  public getSensors(): MachineSensors { return { ...this.sensors }; }
  public getState(): ProcessState { return this.state.tick(this.sensors, this.elapsedSeconds); }
  private buildMaterialInventory(sensors: MachineSensors): MaterialInventory { const waterRemovedKg = Math.min(this.material.waterInitialKg, Math.max(0, sensors.waterRemovedKg)); const oilRecoveredKg = Math.min(this.material.oilPotentialKg, Math.max(0, sensors.oilRecoveredKg)); const removedMassKg = waterRemovedKg + oilRecoveredKg; const remainingMassKg = Math.max(0, this.material.initialMassKg - removedMassKg); const recoveryPercent = this.material.oilPotentialKg > 0 ? oilRecoveredKg / this.material.oilPotentialKg * 100 : 0; return { initialMassKg: this.material.initialMassKg, remainingMassKg, waterInitialKg: this.material.waterInitialKg, waterRemovedKg, waterRemainingKg: Math.max(0, this.material.waterInitialKg - waterRemovedKg), oilPotentialKg: this.material.oilPotentialKg, oilRecoveredKg, oilRemainingPotentialKg: Math.max(0, this.material.oilPotentialKg - oilRecoveredKg), recoveryPercent }; }
  private buildSafetyFrame(state: ProcessState): SafetyFrame { return { stage: state.stage, allSystemsSafe: state.interlocks.allSystemsSafe, chamberSealed: state.interlocks.chamberSealed, pressureSafeForHeating: state.interlocks.pressureSafeForHeating, temperatureSafeForCooling: state.interlocks.temperatureSafeForCooling, vacuumAchieved: state.interlocks.vacuumAchieved, overTemperature: state.interlocks.overTemperature, alarm: state.alarm, transitionReason: state.transitionReason }; }
}
