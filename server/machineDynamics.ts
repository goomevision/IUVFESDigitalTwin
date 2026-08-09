/**
 * Dynamic actuator/process coupling for the IUVFES simulator.
 *
 * This is a deterministic simulation layer: actuator commands influence the
 * next sensor frame instead of merely changing UI labels. It is intentionally
 * parameterized and not presented as a validated industrial control model.
 */

import type { MachineCommand, MachineSensors } from './processStateEngine';

export interface DynamicMachineConfig {
  ambientPressureMbar?: number;
  ambientTemperatureC?: number;
  vacuumRateMbarPerSecond?: number;
  heaterRateCPerSecond?: number;
  passiveHeatLossCPerSecond?: number;
  coolingRateCPerSecond?: number;
  condenserCoolingFactor?: number;
  extractionYieldRatePerSecond?: number;
  actuatorLag?: number;
}

export class MachineDynamicsEngine {
  private readonly c: Required<DynamicMachineConfig>;
  private state: MachineSensors;

  constructor(initial: MachineSensors, config: DynamicMachineConfig = {}) {
    this.c = {
      ambientPressureMbar: 1013.25,
      ambientTemperatureC: 25,
      vacuumRateMbarPerSecond: 7,
      heaterRateCPerSecond: 0.18,
      passiveHeatLossCPerSecond: 0.035,
      coolingRateCPerSecond: 0.12,
      condenserCoolingFactor: 0.05,
      extractionYieldRatePerSecond: 0.00035,
      actuatorLag: 0.35,
      ...config,
    };
    this.state = { ...initial };
  }

  public step(target: MachineSensors, commands: MachineCommand, dtSeconds: number): MachineSensors {
    const dt = Math.max(0.05, dtSeconds);
    const lag = Math.max(0.05, Math.min(1, this.c.actuatorLag));

    const pressureDemand = commands.vacuumPump
      ? Math.max(1, this.state.pressureMbar - this.c.vacuumRateMbarPerSecond * dt)
      : this.state.pressureMbar + (this.c.ambientPressureMbar - this.state.pressureMbar) * 0.03 * dt;
    const pressure = this.blend(this.state.pressureMbar, Math.max(1, Math.min(this.c.ambientPressureMbar, pressureDemand)), lag);

    let temperature = this.state.temperatureC;
    if (commands.heater) temperature += this.c.heaterRateCPerSecond * dt;
    else temperature -= this.c.passiveHeatLossCPerSecond * dt;
    if (commands.cooling) temperature -= this.c.coolingRateCPerSecond * dt;
    if (commands.condenser) temperature -= this.c.condenserCoolingFactor * dt;
    temperature = Math.max(this.c.ambientTemperatureC, Math.min(200, temperature));
    temperature = this.blend(this.state.temperatureC, temperature, lag);

    const thermalFactor = Math.max(0, Math.min(1, (temperature - 25) / 100));
    const vacuumFactor = Math.max(0, Math.min(1, 1 - pressure / this.c.ambientPressureMbar));
    const extractionDrive = commands.extractor ? vacuumFactor * (0.35 + thermalFactor * 0.65) : 0;
    const yieldIncrease = this.c.extractionYieldRatePerSecond * extractionDrive * dt * 100;
    const yieldPercent = Math.min(target.yieldPercent, this.state.yieldPercent + yieldIncrease);
    const yieldRatio = yieldPercent / Math.max(target.yieldPercent, 0.001);
    const oilRecoveredKg = Math.max(this.state.oilRecoveredKg, target.oilRecoveredKg * yieldRatio);
    const waterRemovedKg = Math.max(this.state.waterRemovedKg, target.waterRemovedKg * yieldRatio);

    const energyRate = (commands.heater ? 0.004 : 0) + (commands.vacuumPump ? 0.0015 : 0) + (commands.extractor ? 0.001 : 0) + (commands.cooling ? 0.001 : 0);
    const energyKwh = this.state.energyKwh + energyRate * dt;

    this.state = {
      chamberSealed: this.state.chamberSealed,
      pressureMbar: pressure,
      temperatureC: temperature,
      yieldPercent,
      waterRemovedKg: Math.min(target.waterRemovedKg, waterRemovedKg),
      oilRecoveredKg: Math.min(target.oilRecoveredKg, oilRecoveredKg),
      energyKwh,
    };

    return { ...this.state };
  }

  private blend(current: number, next: number, factor: number): number {
    return current + (next - current) * factor;
  }
}
