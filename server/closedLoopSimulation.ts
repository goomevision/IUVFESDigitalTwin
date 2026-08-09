/**
 * Causal closed-loop simulation coordinator.
 *
 * Interactive steps are wall-clock paced by default. Machine dynamics and the
 * material inventory advance from the same causal timestep, so material state
 * cannot jump independently of temperature/pressure/actuator state.
 */

import { ProcessControlLoop, type ProcessControlSnapshot } from './controlLoop';
import { MachineDynamicsEngine, type MachineDynamicsSnapshot, type VirtualHardwareDynamicsConfig } from './machineDynamics';
import { MaterialProcessEngine, type MaterialInventory } from './materialProcessEngine';
import { ProcessStateEngine, type MachineSensors, type ProcessState } from './processStateEngine';
import { evaluateSafety, type SafetyEvaluation, type SafetyLimits } from './safetyKernel';
import { buildSafetyEventTimeline, type SafetyEvent } from './safetyEventTimeline';
import { propagateFaults, type FaultPropagationScenario } from './faultPropagation';
import { resolveVirtualHardwareProfile } from './virtualHardwareProfile';

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
  faultScenario?: FaultPropagationScenario;
}

export interface CausalFrame {
  step: number; timestampSeconds: number; wallClockTimestampMs?: number; wallClockDeltaMs?: number;
  sensorBefore: MachineSensors; controller: ProcessState; intendedCommands: ProcessState['commands']; effectiveCommands: ProcessState['commands'];
  physicalSensorAfter: MachineSensors; sensorAfter: MachineSensors; materialInventory: MaterialInventory; stateAfter?: ProcessState; safety: SafetyEvaluation; paused: boolean;
}

export interface ClosedLoopResult {
  status: ProcessState['stage']; frames: CausalFrame[]; finalSensors: MachineSensors; finalMaterialInventory: MaterialInventory; pausedSteps: number[]; safetyEvents: SafetyEvent[];
}

export interface ClosedLoopSnapshot {
  version: 1; config: ClosedLoopSimulationConfig; target: MachineSensors; sensors: MachineSensors; elapsedSeconds: number; stepNumber: number; paused: boolean; lastStepWallClockMs?: number;
  state: ProcessState; dynamics: MachineDynamicsSnapshot; materialInventory: MaterialInventory; control: ProcessControlSnapshot; frames: CausalFrame[]; pausedSteps: number[];
}

export class ClosedLoopSimulationEngine {
  private readonly dtSeconds: number; private readonly maxSteps: number; private readonly realTime: boolean;
  private readonly state: ProcessStateEngine; private readonly dynamics: MachineDynamicsEngine; private readonly control: ProcessControlLoop; private readonly material: MaterialProcessEngine;
  private readonly target: MachineSensors; private readonly safetyLimits: Partial<SafetyLimits>; private readonly faultScenario: FaultPropagationScenario;
  private sensors: MachineSensors; private elapsedSeconds = 0; private stepNumber = 0; private paused = false; private lastStepWallClockMs: number | undefined;
  private readonly frames: CausalFrame[] = []; private readonly pausedSteps: number[] = [];

  constructor(private readonly config: ClosedLoopSimulationConfig) {
    this.dtSeconds = Math.max(0.1, config.dtSeconds ?? 1); this.maxSteps = Math.max(1, config.maxSteps ?? Math.ceil(24 * 3600 / this.dtSeconds)); this.realTime = config.realTime ?? true;
    this.safetyLimits = { ...config.safetyLimits };
    this.faultScenario = { id: config.faultScenario?.id ?? 'baseline', label: config.faultScenario?.label ?? 'Baseline / no sensor or actuator fault', sensorFaults: [...(config.faultScenario?.sensorFaults ?? [])], actuatorFaults: [...(config.faultScenario?.actuatorFaults ?? [])] };
    this.target = { chamberSealed: true, pressureMbar: Math.max(1, config.targetPressureMbar), temperatureC: Math.max(25, config.targetTemperatureC), yieldPercent: 100,
      waterRemovedKg: Math.max(0, config.materialWeightKg * config.waterContentPercent / 100), oilRecoveredKg: Math.max(0, config.materialWeightKg * config.oilContentPercent / 100), energyKwh: 0 };
    this.sensors = this.initialSensors();
    this.state = new ProcessStateEngine({ targetPressureMbar: config.targetPressureMbar, targetTemperatureC: config.targetTemperatureC, ...config.safetyLimits }, this.sensors);
    this.dynamics = new MachineDynamicsEngine(this.sensors, resolveVirtualHardwareProfile(config.hardware));
    this.material = new MaterialProcessEngine({ materialMassKg: config.materialWeightKg, initialWaterFraction: Math.max(0, config.waterContentPercent / 100), initialOilFraction: Math.max(0, config.oilContentPercent / 100) });
    this.control = new ProcessControlLoop();
  }

  private initialSensors(): MachineSensors { return { chamberSealed: true, pressureMbar: 1013.25, temperatureC: 25, yieldPercent: 0, waterRemovedKg: 0, oilRecoveredKg: 0, energyKwh: 0 }; }
  public isPaused(): boolean { return this.paused; } public pause(): void { this.paused = true; } public resume(): void { this.paused = false; this.lastStepWallClockMs = Date.now(); }

  public reset(): void {
    this.paused = false; this.elapsedSeconds = 0; this.stepNumber = 0; this.lastStepWallClockMs = undefined; this.frames.length = 0; this.pausedSteps.length = 0;
    this.sensors = this.initialSensors(); this.state.reset(this.sensors); this.control.reset(); this.dynamics.restore({ state: { ...this.sensors }, config: { ...this.dynamics.snapshot().config } });
    this.material.restore(new MaterialProcessEngine({ materialMassKg: this.config.materialWeightKg, initialWaterFraction: Math.max(0, this.config.waterContentPercent / 100), initialOilFraction: Math.max(0, this.config.oilContentPercent / 100) }).snapshot());
  }

  public step(): CausalFrame | null {
    const currentStage = this.state.snapshotState().stage;
    if (this.paused || this.stepNumber >= this.maxSteps || currentStage === 'COMPLETE' || currentStage === 'FAULT') { if (this.paused) this.pausedSteps.push(this.stepNumber); return null; }
    const now = Date.now(); const requiredWallClockMs = this.dtSeconds * 1000;
    if (this.realTime && this.lastStepWallClockMs !== undefined && now - this.lastStepWallClockMs < requiredWallClockMs) return null;
    return this.advanceStep(now);
  }

  private advanceStep(now: number): CausalFrame {
    const sensorBefore = { ...this.sensors };
    const controllerBeforeActuation = this.state.tick(this.sensors, this.elapsedSeconds);
    const controlOutput = this.control.update({ targetTemperatureC: this.target.temperatureC, targetPressureMbar: this.target.pressureMbar, temperatureC: this.sensors.temperatureC, pressureMbar: this.sensors.pressureMbar, stage: controllerBeforeActuation.stage, dtSeconds: this.dtSeconds });
    const intendedCommands = { ...controllerBeforeActuation.commands, heater: controlOutput.heaterPower > 0.01, vacuumPump: controlOutput.vacuumPumpPower > 0.01, condenser: controlOutput.valve.vaporToCondenser > 0.01, cooling: controlOutput.valve.coolingWater > 0.01 };
    const effectiveCommands = propagateFaults(this.sensors, intendedCommands, this.faultScenario, this.sensors).effectiveCommands;
    const controller = { ...controllerBeforeActuation, commands: intendedCommands };

    // Explicit Euler coupling: latent load generated by material in timestep n is
    // consumed by the thermal balance in timestep n+1. This preserves causality.
    const latentHeatLoadKW = this.material.snapshot().latentHeatLoadKW;
    const physicalSensorAfter = this.dynamics.step(this.target, effectiveCommands, this.dtSeconds, latentHeatLoadKW);
    const materialInventory = this.material.step({ materialMassKg: this.config.materialWeightKg, initialWaterFraction: this.config.waterContentPercent / 100, initialOilFraction: this.config.oilContentPercent / 100,
      chamberPressureMbar: physicalSensorAfter.pressureMbar, materialTemperatureC: physicalSensorAfter.temperatureC, heaterPowerFraction: intendedCommands.heater ? 1 : 0,
      vacuumPowerFraction: effectiveCommands.vacuumPump ? 1 : 0, extractorPowerFraction: effectiveCommands.extractor ? 1 : 0, condenserPowerFraction: effectiveCommands.condenser ? 1 : 0,
      coolingPowerFraction: effectiveCommands.cooling ? 1 : 0, dtSeconds: this.dtSeconds });
    const sensorWithMaterial = { ...physicalSensorAfter, waterRemovedKg: Math.min(this.target.waterRemovedKg, materialInventory.condensateWaterKg), oilRecoveredKg: Math.min(this.target.oilRecoveredKg, materialInventory.recoveredOilKg), yieldPercent: Math.min(100, materialInventory.oilRecoveryFraction * 100) };
    const sensorAfter = propagateFaults(sensorWithMaterial, effectiveCommands, this.faultScenario, this.sensors).observedSensors;
    const previousWallClockMs = this.lastStepWallClockMs; this.elapsedSeconds += this.dtSeconds; this.stepNumber += 1; this.sensors = sensorAfter; this.lastStepWallClockMs = now;
    const safety = evaluateSafety(sensorBefore, sensorAfter, this.dtSeconds, this.safetyLimits); const stateAfter = this.state.tick(this.sensors, this.elapsedSeconds);
    const frame: CausalFrame = { step: this.stepNumber, timestampSeconds: this.elapsedSeconds, wallClockTimestampMs: now, wallClockDeltaMs: previousWallClockMs === undefined ? undefined : now - previousWallClockMs,
      sensorBefore, controller, intendedCommands, effectiveCommands, physicalSensorAfter, sensorAfter: { ...sensorAfter }, materialInventory: { ...materialInventory }, stateAfter, safety, paused: false };
    this.frames.push(frame); return frame;
  }

  public runToCompletion(): ClosedLoopResult {
    while (this.stepNumber < this.maxSteps) { const currentState = this.state.snapshotState(); if (currentState.stage === 'COMPLETE' || currentState.stage === 'FAULT') break; this.advanceStep(Date.now()); }
    const finalState = this.state.snapshotState();
    return { status: finalState.stage, frames: [...this.frames], finalSensors: { ...this.sensors }, finalMaterialInventory: this.material.snapshot(), pausedSteps: [...this.pausedSteps], safetyEvents: buildSafetyEventTimeline(this.frames) };
  }
  public getFrames(): CausalFrame[] { return [...this.frames]; } public getSensors(): MachineSensors { return { ...this.sensors }; } public getState(): ProcessState { return this.state.snapshotState(); }
  public getMaterialInventory(): MaterialInventory { return this.material.snapshot(); } public getSafetyEvents(): SafetyEvent[] { return buildSafetyEventTimeline(this.frames); }

  public snapshot(): ClosedLoopSnapshot {
    return { version: 1, config: { ...this.config, realTime: this.realTime, hardware: this.config.hardware ? { ...this.config.hardware } : undefined, faultScenario: { ...this.faultScenario, sensorFaults: [...(this.faultScenario.sensorFaults ?? [])], actuatorFaults: [...(this.faultScenario.actuatorFaults ?? [])] }, },
      target: { ...this.target }, sensors: { ...this.sensors }, elapsedSeconds: this.elapsedSeconds, stepNumber: this.stepNumber, paused: this.paused, lastStepWallClockMs: this.lastStepWallClockMs,
      state: this.state.snapshotState(), dynamics: this.dynamics.snapshot(), materialInventory: this.material.snapshot(), control: this.control.snapshot(), frames: [...this.frames], pausedSteps: [...this.pausedSteps] };
  }

  public restore(snapshot: ClosedLoopSnapshot): void {
    if (snapshot.version !== 1) throw new Error(`Unsupported simulation snapshot version: ${snapshot.version}`);
    if ((snapshot.config.realTime ?? true) !== this.realTime) throw new Error('Snapshot real-time mode does not match simulation configuration');
    if (snapshot.config.targetPressureMbar !== this.config.targetPressureMbar || snapshot.config.targetTemperatureC !== this.config.targetTemperatureC || snapshot.config.materialWeightKg !== this.config.materialWeightKg || snapshot.config.waterContentPercent !== this.config.waterContentPercent || snapshot.config.oilContentPercent !== this.config.oilContentPercent) throw new Error('Snapshot configuration does not match simulation configuration');
    const snapshotHardware = snapshot.config.hardware ?? {}; const currentHardware = this.config.hardware ?? {};
    const hardwareKeys: Array<keyof VirtualHardwareDynamicsConfig> = ['chamberVolumeL', 'pumpCapacityM3h', 'thermalMassKJPerC', 'heatingPowerKW', 'coolingPowerKW', 'leakRateMbarPerSecond', 'effectiveHeatLossKWPerC'];
    for (const key of hardwareKeys) if (snapshotHardware[key] !== currentHardware[key]) throw new Error('Snapshot hardware profile does not match simulation configuration');
    if (JSON.stringify(snapshot.config.faultScenario ?? null) !== JSON.stringify(this.config.faultScenario ?? null)) throw new Error('Snapshot fault scenario does not match simulation configuration');
    this.sensors = { ...snapshot.sensors }; this.elapsedSeconds = snapshot.elapsedSeconds; this.stepNumber = snapshot.stepNumber; this.paused = snapshot.paused; this.lastStepWallClockMs = this.realTime && !this.paused ? Date.now() : snapshot.lastStepWallClockMs;
    this.frames.length = 0; this.frames.push(...snapshot.frames); this.pausedSteps.length = 0; this.pausedSteps.push(...snapshot.pausedSteps); this.state.restore(snapshot.state); this.dynamics.restore(snapshot.dynamics); this.material.restore(snapshot.materialInventory); this.control.restore(snapshot.control);
  }
}
