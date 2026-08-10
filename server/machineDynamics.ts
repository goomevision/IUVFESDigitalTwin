import { UltrasonicEngine, type UltrasonicConfig, type UltrasonicState } from './ultrasonicEngine';
import { WaterThermoEngine, type WaterThermoState } from './waterThermo';
import type { MachineCommand, MachineSensors } from './processStateEngine';

export interface VirtualHardwareDynamicsConfig { connectedVolumeL: number; pumpCapacityM3PerHour: number; thermalMassKjPerK: number; heatingPowerKw: number; coolingPowerKw: number; leakRateMbarPerSecond: number; }
export interface HardwareProfile { chamberVolumeL: number; pumpCapacityM3h: number; thermalMassKJPerC: number; heatingPowerKW: number; coolingPowerKW: number; leakRateMbarPerSecond: number; }
export interface DynamicMachineConfig {
  ambientPressureMbar?: number; ambientTemperatureC?: number; vacuumRateMbarPerSecond?: number; heaterRateCPerSecond?: number; passiveHeatLossCPerSecond?: number; coolingRateCPerSecond?: number; condenserCoolingFactor?: number; extractionYieldRatePerSecond?: number; actuatorLag?: number;
  hardware?: VirtualHardwareDynamicsConfig | HardwareProfile;
  chamberVolumeL?: number; pumpCapacityM3h?: number; thermalMassKJPerC?: number; heatingPowerKW?: number; coolingPowerKW?: number; leakRateMbarPerSecond?: number;
  ultrasonic?: UltrasonicConfig;
}
export interface MachineDynamicsSnapshot { state: MachineSensors; config: HardwareProfile | null; }
type ResolvedDynamicsConfig = { ambientPressureMbar:number; ambientTemperatureC:number; vacuumRateMbarPerSecond:number; heaterRateCPerSecond:number; passiveHeatLossCPerSecond:number; coolingRateCPerSecond:number; condenserCoolingFactor:number; extractionYieldRatePerSecond:number; actuatorLag:number; hardware?: VirtualHardwareDynamicsConfig; ultrasonic?: UltrasonicEngine; };

function toHardware(config: DynamicMachineConfig): VirtualHardwareDynamicsConfig | undefined {
  const h = config.hardware as any;
  if (h) {
    if ('connectedVolumeL' in h) return { connectedVolumeL: h.connectedVolumeL, pumpCapacityM3PerHour: h.pumpCapacityM3PerHour, thermalMassKjPerK: h.thermalMassKjPerK, heatingPowerKw: h.heatingPowerKw, coolingPowerKw: h.coolingPowerKw, leakRateMbarPerSecond: h.leakRateMbarPerSecond };
    return { connectedVolumeL: h.chamberVolumeL, pumpCapacityM3PerHour: h.pumpCapacityM3h, thermalMassKjPerK: h.thermalMassKJPerC, heatingPowerKw: h.heatingPowerKW, coolingPowerKw: h.coolingPowerKW, leakRateMbarPerSecond: h.leakRateMbarPerSecond };
  }
  if (config.chamberVolumeL !== undefined || config.pumpCapacityM3h !== undefined || config.thermalMassKJPerC !== undefined || config.heatingPowerKW !== undefined || config.coolingPowerKW !== undefined) {
    return { connectedVolumeL: config.chamberVolumeL ?? 250, pumpCapacityM3PerHour: config.pumpCapacityM3h ?? 200, thermalMassKjPerK: config.thermalMassKJPerC ?? 250, heatingPowerKw: config.heatingPowerKW ?? 9, coolingPowerKw: config.coolingPowerKW ?? 3, leakRateMbarPerSecond: config.leakRateMbarPerSecond ?? 0 };
  }
  return undefined;
}
function profile(h?: VirtualHardwareDynamicsConfig): HardwareProfile | null { return h ? { chamberVolumeL:h.connectedVolumeL, pumpCapacityM3h:h.pumpCapacityM3PerHour, thermalMassKJPerC:h.thermalMassKjPerK, heatingPowerKW:h.heatingPowerKw, coolingPowerKW:h.coolingPowerKw, leakRateMbarPerSecond:h.leakRateMbarPerSecond } : null; }

export class MachineDynamicsEngine {
  private readonly c: ResolvedDynamicsConfig;
  private readonly waterThermo = new WaterThermoEngine();
  private state: MachineSensors;
  constructor(initial: MachineSensors, config: DynamicMachineConfig = {}) {
    const hardware = toHardware(config);
    this.c = { ambientPressureMbar: config.ambientPressureMbar ?? 1013.25, ambientTemperatureC: config.ambientTemperatureC ?? 25, vacuumRateMbarPerSecond: config.vacuumRateMbarPerSecond ?? 7, heaterRateCPerSecond: config.heaterRateCPerSecond ?? .18, passiveHeatLossCPerSecond: config.passiveHeatLossCPerSecond ?? .035, coolingRateCPerSecond: config.coolingRateCPerSecond ?? .12, condenserCoolingFactor: config.condenserCoolingFactor ?? .05, extractionYieldRatePerSecond: config.extractionYieldRatePerSecond ?? .00035, actuatorLag: config.actuatorLag ?? .35, hardware, ultrasonic: config.ultrasonic ? new UltrasonicEngine(config.ultrasonic) : undefined };
    this.state = { ...initial };
  }
  public step(target: MachineSensors, commands: MachineCommand, dtSeconds: number): MachineSensors {
    const dt = Math.max(.05, dtSeconds); const lag = Math.max(.05, Math.min(1, this.c.actuatorLag)); const hardware = this.c.hardware; const ultrasonic = this.c.ultrasonic?.evaluate(this.state.pressureMbar);
    const hardwarePumpRate = hardware ? Math.max(.001, hardware.pumpCapacityM3PerHour * 1000 / 60 / Math.max(hardware.connectedVolumeL, .001)) : this.c.vacuumRateMbarPerSecond;
    const pumpRate = hardware ? Math.max(.01, hardwarePumpRate * .12) : this.c.vacuumRateMbarPerSecond; const leakRate = hardware ? Math.max(0, hardware.leakRateMbarPerSecond) : 0;
    const pressureDemand = commands.vacuumPump ? Math.max(1, this.state.pressureMbar - pumpRate * dt + leakRate * dt) : this.state.pressureMbar + (this.c.ambientPressureMbar - this.state.pressureMbar) * .03 * dt + leakRate * dt;
    const pressure = this.blend(this.state.pressureMbar, Math.max(1, Math.min(this.c.ambientPressureMbar, pressureDemand)), lag);
    let temperature = this.state.temperatureC; const ultrasonicHeatingKw = (ultrasonic?.acousticHeatingW ?? 0) / 1000; const thermalMassKjPerK = Math.max(.001, hardware?.thermalMassKjPerK ?? 250);
    if (hardware) { if (commands.heater) temperature += ((hardware.heatingPowerKw + ultrasonicHeatingKw) * dt) / thermalMassKjPerK; else temperature += (ultrasonicHeatingKw * dt) / thermalMassKjPerK - this.c.passiveHeatLossCPerSecond * dt; if (commands.cooling) temperature -= (hardware.coolingPowerKw * dt) / thermalMassKjPerK; }
    else { if (commands.heater) temperature += this.c.heaterRateCPerSecond * dt; else temperature -= this.c.passiveHeatLossCPerSecond * dt; if (ultrasonicHeatingKw > 0) temperature += (ultrasonicHeatingKw * dt) / thermalMassKjPerK; if (commands.cooling) temperature -= this.c.coolingRateCPerSecond * dt; }
    if (commands.condenser) temperature -= this.c.condenserCoolingFactor * dt; temperature = Math.max(this.c.ambientTemperatureC, Math.min(200, temperature)); temperature = this.blend(this.state.temperatureC, temperature, lag);
    const remainingWaterKg = Math.max(0, target.waterRemovedKg - this.state.waterRemovedKg); const waterThermo = this.waterThermo.evaluate(temperature, pressure, remainingWaterKg, dt); const thermalFactor = Math.max(0, Math.min(1, (temperature - 25) / 100)); const vacuumFactor = Math.max(0, Math.min(1, 1 - pressure / this.c.ambientPressureMbar)); const ultrasonicMassTransfer = ultrasonic?.massTransferMultiplier ?? 1;
    const extractionDrive = commands.extractor ? vacuumFactor * (.35 + thermalFactor * .65) * ultrasonicMassTransfer : 0; const yieldIncrease = this.c.extractionYieldRatePerSecond * extractionDrive * dt * 100; const yieldPercentage = Math.min(target.yieldPercent, this.state.yieldPercent + yieldIncrease); const oilRecoveredKg = Math.max(this.state.oilRecoveredKg, target.oilRecoveredKg * (yieldPercentage / Math.max(target.yieldPercent, .001)));
    const waterThermoFactor = commands.extractor ? Math.max(.02, waterThermo.vaporDrive) : 0; const waterRemovalDrive = Math.min(1, extractionDrive * (.25 + .75 * waterThermoFactor)); const waterIncrease = target.waterRemovedKg * Math.min(1, this.c.extractionYieldRatePerSecond * 220 * waterRemovalDrive * dt); const waterRemovedKg = Math.max(this.state.waterRemovedKg, Math.min(target.waterRemovedKg, this.state.waterRemovedKg + waterIncrease));
    const processEnergyRateKwhPerSecond = (commands.heater ? (hardware?.heatingPowerKw ?? 4) / 3600 : 0) + (commands.vacuumPump ? .0015 / 3600 : 0) + (commands.extractor ? .001 / 3600 : 0) + (commands.cooling ? (hardware?.coolingPowerKw ?? 1) / 3600 : 0); const ultrasonicEnergyRateKwhPerSecond = ultrasonic ? ultrasonic.electricalPowerW * ultrasonic.dutyCycle / 1000 / 3600 : 0; const vaporizationEnergyRateKwhPerSecond = waterThermo.waterMassVaporizedKg * waterThermo.latentHeatKjPerKg / 3600 / dt; const energyConsumed = this.state.energyKwh + (processEnergyRateKwhPerSecond + ultrasonicEnergyRateKwhPerSecond + vaporizationEnergyRateKwhPerSecond) * dt;
    this.state = { ...this.state, pressureMbar: pressure, temperatureC: temperature, yieldPercent: yieldPercentage, waterRemovedKg, oilRecoveredKg: Math.min(target.oilRecoveredKg, oilRecoveredKg), energyKwh: Math.max(0, energyConsumed) }; return { ...this.state };
  }
  public getUltrasonicState(staticPressureMbar = this.state.pressureMbar): UltrasonicState | null { return this.c.ultrasonic?.evaluate(staticPressureMbar) ?? null; }
  public getWaterThermoState(targetWaterKg = 0, dtSeconds = 1): WaterThermoState { const remaining = Math.max(0, targetWaterKg - this.state.waterRemovedKg); return this.waterThermo.evaluate(this.state.temperatureC, this.state.pressureMbar, remaining, dtSeconds); }
  public snapshot(): MachineDynamicsSnapshot { return { state: { ...this.state }, config: profile(this.c.hardware) }; }
  public restore(snapshot: MachineDynamicsSnapshot): void { const current = profile(this.c.hardware); if (JSON.stringify(current) !== JSON.stringify(snapshot.config)) throw new Error('Snapshot hardware profile does not match simulation configuration'); this.state = { ...snapshot.state }; }
  private blend(current: number, next: number, factor: number): number { return current + (next - current) * factor; }
}
