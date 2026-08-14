/**
 * IUVFES Digital Twin — causal process state engine.
 * Sensor frame -> interlocks -> state transition -> actuator commands.
 */

export type ProcessStage = 'PRE_FLIGHT' | 'CHARGE' | 'VACUUM' | 'HEAT_UP' | 'EXTRACTION' | 'CONDENSATION' | 'COOL_DOWN' | 'COMPLETE' | 'FAULT';
export interface MachineCommand { vacuumPump: boolean; heater: boolean; extractor: boolean; condenser: boolean; cooling: boolean; }
export interface MachineSensors { chamberSealed: boolean; pressureMbar: number; temperatureC: number; yieldPercent: number; waterRemovedKg: number; oilRecoveredKg: number; energyKwh: number; }
export interface InterlockState { chamberSealed: boolean; pressureSafeForHeating: boolean; temperatureSafeForCooling: boolean; overTemperature: boolean; vacuumAchieved: boolean; allSystemsSafe: boolean; }
export interface ProcessState { stage: ProcessStage; progress: number; elapsedSeconds: number; sensors: MachineSensors; commands: MachineCommand; interlocks: InterlockState; alarm: string | null; transitionReason: string; }
export interface ProcessStateConfig { targetPressureMbar: number; targetTemperatureC: number; maxTemperatureC?: number; extractionMinimumTemperatureC?: number; coolingTemperatureC?: number; }
const DEFAULTS = { maxTemperatureC: 150, extractionMinimumTemperatureC: 45, coolingTemperatureC: 35 };

export class ProcessStateEngine {
  private readonly config: Required<ProcessStateConfig>;
  private state: ProcessState;
  constructor(config: ProcessStateConfig, initialSensors: MachineSensors) { this.config = { ...DEFAULTS, ...config }; this.state = this.initialState(initialSensors, 'Controller initialized; waiting for pre-flight checks.'); }
  public setTargets(targets: Pick<ProcessStateConfig, 'targetPressureMbar' | 'targetTemperatureC' | 'coolingTemperatureC'>): void { this.config.targetPressureMbar = Math.max(1, Math.min(1000, targets.targetPressureMbar)); this.config.targetTemperatureC = Math.max(25, Math.min(150, targets.targetTemperatureC)); if (targets.coolingTemperatureC !== undefined) this.config.coolingTemperatureC = Math.max(25, Math.min(80, targets.coolingTemperatureC)); }
  public getTargets(): Pick<ProcessStateConfig, 'targetPressureMbar' | 'targetTemperatureC' | 'coolingTemperatureC'> { return { targetPressureMbar: this.config.targetPressureMbar, targetTemperatureC: this.config.targetTemperatureC, coolingTemperatureC: this.config.coolingTemperatureC }; }
  public tick(sensors: MachineSensors, elapsedSeconds: number): ProcessState {
    const currentOverTemperatureTrip = this.state.stage === 'FAULT' && this.state.alarm?.startsWith('OVER_TEMPERATURE:') === true;
    const interlocks = this.evaluateInterlocks(sensors, currentOverTemperatureTrip); this.state.sensors = { ...sensors }; this.state.interlocks = interlocks; this.state.elapsedSeconds = elapsedSeconds;
    if (interlocks.overTemperature) { this.trip('OVER_TEMPERATURE: heater disabled and process moved to FAULT.'); return this.snapshot(); }
    if (this.state.stage !== 'FAULT') this.state.alarm = null;
    switch (this.state.stage) {
      case 'PRE_FLIGHT': if (interlocks.chamberSealed) this.transition('CHARGE', 'Pre-flight checks passed; charge phase enabled.'); else this.trip('CHAMBER_SEAL_NOT_CONFIRMED: process cannot start.'); break;
      case 'CHARGE': this.transition('VACUUM', 'Charge accepted; vacuum evacuation enabled.'); break;
      case 'VACUUM': if (interlocks.vacuumAchieved) this.transition('HEAT_UP', 'Target vacuum achieved; heater interlock released.'); break;
      case 'HEAT_UP': if (interlocks.pressureSafeForHeating && sensors.temperatureC >= this.config.targetTemperatureC) this.transition('EXTRACTION', 'Target temperature reached; extraction enabled.'); break;
      case 'EXTRACTION': if (sensors.yieldPercent >= 99 || (sensors.oilRecoveredKg > 0 && sensors.temperatureC < this.config.extractionMinimumTemperatureC)) this.transition('CONDENSATION', 'Extraction endpoint reached; condenser enabled.'); break;
      case 'CONDENSATION': if (sensors.temperatureC <= this.config.coolingTemperatureC + 20) this.transition('COOL_DOWN', 'Condensation stabilized; cooling cycle enabled.'); break;
      case 'COOL_DOWN': if (interlocks.temperatureSafeForCooling) this.transition('COMPLETE', 'Safe handling temperature reached; process complete.'); break;
      case 'COMPLETE': case 'FAULT': break;
    }
    this.state.commands = this.commandsForStage(this.state.stage); this.state.progress = this.progressForStage(this.state.stage, sensors); return this.snapshot();
  }
  public reset(sensors: MachineSensors): ProcessState { this.state = this.initialState(sensors, 'Controller reset; waiting for pre-flight checks.'); return this.snapshot(); }
  public getSnapshot(): ProcessState { return this.snapshot(); }
  public restore(snapshot: ProcessState): void { this.state = { ...snapshot, sensors: { ...snapshot.sensors }, commands: { ...snapshot.commands }, interlocks: { ...snapshot.interlocks } }; }
  private initialState(sensors: MachineSensors, reason: string): ProcessState { return { stage: 'PRE_FLIGHT', progress: 0, elapsedSeconds: 0, sensors: { ...sensors }, commands: this.off(), interlocks: this.evaluateInterlocks(sensors), alarm: null, transitionReason: reason }; }
  private evaluateInterlocks(sensors: MachineSensors, latchedOverTemperature = false): InterlockState { const overTemperature = latchedOverTemperature || sensors.temperatureC >= this.config.maxTemperatureC; const pressureSafeForHeating = sensors.pressureMbar <= Math.max(this.config.targetPressureMbar * 1.15, 5); const vacuumAchieved = sensors.pressureMbar <= this.config.targetPressureMbar * 1.05; const temperatureSafeForCooling = sensors.temperatureC <= this.config.coolingTemperatureC; return { chamberSealed: sensors.chamberSealed, pressureSafeForHeating, temperatureSafeForCooling, overTemperature, vacuumAchieved, allSystemsSafe: sensors.chamberSealed && !overTemperature }; }
  private commandsForStage(stage: ProcessStage): MachineCommand { const off = this.off(); if (stage === 'VACUUM') return { ...off, vacuumPump: true }; if (stage === 'HEAT_UP') return { ...off, vacuumPump: true, heater: true }; if (stage === 'EXTRACTION') return { ...off, vacuumPump: true, heater: true, extractor: true, condenser: true }; if (stage === 'CONDENSATION') return { ...off, vacuumPump: true, condenser: true }; if (stage === 'COOL_DOWN') return { ...off, cooling: true, condenser: true }; return off; }
  private progressForStage(stage: ProcessStage, sensors: MachineSensors): number { switch (stage) { case 'PRE_FLIGHT': return 0.02; case 'CHARGE': return 0.05; case 'VACUUM': return Math.min(0.25, 0.10 + (1 - Math.min(1, sensors.pressureMbar / Math.max(this.config.targetPressureMbar, 1))) * 0.15); case 'HEAT_UP': return Math.min(0.45, 0.25 + Math.max(0, Math.min(1, (sensors.temperatureC - 25) / Math.max(this.config.targetTemperatureC - 25, 1))) * 0.20); case 'EXTRACTION': return 0.45 + Math.min(0.33, sensors.yieldPercent / 100 * 0.33); case 'CONDENSATION': return 0.78; case 'COOL_DOWN': return 0.90; case 'COMPLETE': return 1; case 'FAULT': return this.state.progress; } }
  private transition(stage: ProcessStage, reason: string): void { this.state.stage = stage; this.state.transitionReason = reason; }
  private trip(alarm: string): void { this.state.stage = 'FAULT'; this.state.alarm = alarm; this.state.transitionReason = 'Safety controller tripped the process.'; this.state.commands = { ...this.off(), cooling: true }; }
  private off(): MachineCommand { return { vacuumPump: false, heater: false, extractor: false, condenser: false, cooling: false }; }
  private snapshot(): ProcessState { return { ...this.state, sensors: { ...this.state.sensors }, commands: { ...this.state.commands }, interlocks: { ...this.state.interlocks } }; }
}