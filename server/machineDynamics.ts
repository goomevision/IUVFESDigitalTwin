/**
 * Dynamic actuator/process coupling for the IUVFES simulator.
 *
 * Hardware inputs are virtual engineering parameters. They influence the
 * deterministic process model but are not safety certification or a validated
 * industrial control model. Physical design values must retain provenance.
 */

import type { MachineCommand, MachineSensors } from './processStateEngine';
import { stepThermalModel } from './thermalEngineering';

export interface VirtualHardwareDynamicsConfig {
  /** Connected reactor/vacuum volume in litres. */
  chamberVolumeL?: number;
  /** Pump nominal capacity in cubic metres per hour. */
  pumpCapacityM3h?: number;
  /** Effective thermal mass of the heated process system in kJ/K. */
  thermalMassKJPerC?: number;
  /** Available heating power in kW. */
  heatingPowerKW?: number;
  /** Available cooling power in kW-equivalent simulation units. */
  coolingPowerKW?: number;
  /** Effective pressure-rise rate caused by leaks in mbar/s. */
  leakRateMbarPerSecond?: number;
  /** Effective heat-loss coefficient to ambient in kW/K. */
  effectiveHeatLossKWPerC?: number;
}

export interface DynamicMachineConfig extends VirtualHardwareDynamicsConfig {
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

export interface MachineDynamicsSnapshot {
  state: MachineSensors;
  config: Required<DynamicMachineConfig>;
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
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      thermalMassKJPerC: 250,
      heatingPowerKW: 9,
      coolingPowerKW: 3,
      leakRateMbarPerSecond: 0,
      effectiveHeatLossKWPerC: 0,
      ...config,
    };
    this.state = { ...initial };
  }

  public step(target: MachineSensors, commands: MachineCommand, dtSeconds: number): MachineSensors {
    const dt = Math.max(0.05, dtSeconds);
    const lag = Math.max(0.05, Math.min(1, this.c.actuatorLag));

    // Vacuum response scales with pump capacity and inversely with connected
    // volume. The legacy vacuum rate remains the nominal reference for a
    // 250 L chamber and 200 m³/h pump.
    const volumeFactor = 250 / Math.max(this.c.chamberVolumeL, 1);
    const pumpFactor = this.c.pumpCapacityM3h / 200;
    const hardwareVacuumRate = this.c.vacuumRateMbarPerSecond * volumeFactor * pumpFactor;
    const vacuumRate = Math.max(0, hardwareVacuumRate);
    const leakRise = Math.max(0, this.c.leakRateMbarPerSecond) * dt;
    const pressureDemand = commands.vacuumPump
      ? Math.max(1, this.state.pressureMbar - vacuumRate * dt + leakRise)
      : this.state.pressureMbar + (this.c.ambientPressureMbar - this.state.pressureMbar) * 0.03 * dt + leakRise;
    const pressure = this.blend(
      this.state.pressureMbar,
      Math.max(1, Math.min(this.c.ambientPressureMbar, pressureDemand)),
      lag,
    );

    const thermal = stepThermalModel({
      initialTemperatureC: this.state.temperatureC,
      ambientTemperatureC: this.c.ambientTemperatureC,
      targetTemperatureC: target.temperatureC,
      thermalMassKJPerC: this.c.thermalMassKJPerC,
      heaterPowerKW: commands.heater ? this.c.heatingPowerKW : 0,
      coolingPowerKW: commands.cooling ? this.c.coolingPowerKW : 0,
      effectiveHeatLossKWPerC: this.c.effectiveHeatLossKWPerC,
      heaterEfficiency: this.c.heaterRateCPerSecond / 0.18,
      coolingEfficiency: this.c.coolingRateCPerSecond / 0.12,
    }, dt);

    let temperature = thermal.temperatureC;
    if (commands.condenser) temperature -= this.c.condenserCoolingFactor * dt;
    temperature = Math.max(this.c.ambientTemperatureC, Math.min(200, temperature));
    temperature = this.blend(this.state.temperatureC, temperature, lag);

    const thermalFactor = Math.max(0, Math.min(1, (temperature - 25) / 100));
    const vacuumFactor = Math.max(0, Math.min(1, 1 - pressure / this.c.ambientPressureMbar));
    const extractionDrive = commands.extractor ? vacuumFactor * (0.35 + thermalFactor * 0.65) : 0;
    const yieldIncrease = this.c.extractionYieldRatePerSecond * extractionDrive * dt * 100;
    const yieldPercentage = Math.min(target.yieldPercent, this.state.yieldPercent + yieldIncrease);
    const oilRecoveredKg = Math.max(
      this.state.oilRecoveredKg,
      target.oilRecoveredKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)),
    );
    const waterRemovedKg = Math.max(
      this.state.waterRemovedKg,
      target.waterRemovedKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)),
    );
    const energyRate =
      (commands.heater ? Math.max(0, this.c.heatingPowerKW) / 2250 : 0) +
      (commands.vacuumPump ? 0.0015 : 0) +
      (commands.extractor ? 0.001 : 0) +
      (commands.cooling ? Math.max(0, this.c.coolingPowerKW) / 3000 : 0);
    const energyConsumed = this.state.energyKwh + energyRate * dt;

    this.state = {
      ...this.state,
      pressureMbar: pressure,
      temperatureC: temperature,
      yieldPercent: yieldPercentage,
      waterRemovedKg: Math.min(target.waterRemovedKg, waterRemovedKg),
      oilRecoveredKg: Math.min(target.oilRecoveredKg, oilRecoveredKg),
      energyKwh: Math.max(0, energyConsumed),
    };
    return { ...this.state };
  }

  public snapshot(): MachineDynamicsSnapshot {
    return { state: { ...this.state }, config: { ...this.c } };
  }

  public restore(snapshot: MachineDynamicsSnapshot): void {
    this.state = { ...snapshot.state };
  }

  private blend(current: number, next: number, factor: number): number {
    return current + (next - current) * factor;
  }
}
