/**
 * Dynamic actuator/process coupling for the IUVFES simulator.
 *
 * Hardware inputs are virtual engineering parameters. They influence the
 * deterministic process model but are not safety certification or a validated
 * industrial control model. Physical design values must retain provenance.
 */

import type { MachineCommand, MachineSensors } from './processStateEngine';
import { stepThermalModel } from './thermalEngineering';
import { stepVacuumDynamics } from './vacuumDynamics';
import { DEFAULT_VIRTUAL_HARDWARE_PROFILE, resolveVirtualHardwareProfile } from './virtualHardwareProfile';

export interface VirtualHardwareDynamicsConfig {
  chamberVolumeL?: number;
  pumpCapacityM3h?: number;
  thermalMassKJPerC?: number;
  heatingPowerKW?: number;
  coolingPowerKW?: number;
  leakRateMbarPerSecond?: number;
  effectiveHeatLossKWPerC?: number;
  vacuumLineConductanceFactor?: number;
  vacuumVaporMolarMassKgPerMol?: number;
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

export interface MachineDynamicsSnapshot { state: MachineSensors; config: Required<DynamicMachineConfig>; }

export { DEFAULT_VIRTUAL_HARDWARE_PROFILE };

export class MachineDynamicsEngine {
  private readonly c: Required<DynamicMachineConfig>;
  private state: MachineSensors;

  constructor(initial: MachineSensors, config: DynamicMachineConfig = {}) {
    this.c = resolveVirtualHardwareProfile(config);
    this.state = { ...initial };
  }

  public step(target: MachineSensors, commands: MachineCommand, dtSeconds: number, latentHeatLoadKW = 0, vaporGenerationKgPerS = 0): MachineSensors {
    const dt = Math.max(0.05, dtSeconds);
    const lag = Math.max(0.05, Math.min(1, this.c.actuatorLag));
    const volumeM3 = Math.max(1e-6, this.c.chamberVolumeL / 1000);
    const pumpM3PerS = Math.max(0, this.c.pumpCapacityM3h / 3600);
    const conductance = Math.max(0.01, Math.min(1, this.c.vacuumLineConductanceFactor));
    const gasTemperatureK = Math.max(1, this.state.temperatureC + 273.15);
    const vacuum = stepVacuumDynamics({
      timeStepS: dt,
      absolutePressureKPa: Math.max(0.1, this.state.pressureMbar / 10),
      vesselVolumeM3: volumeM3,
      gasTemperatureK,
      pumpSpeedM3PerS: pumpM3PerS * conductance,
      valveOpening: commands.vacuumPump ? 1 : 0,
      vaporGenerationKgPerS: Math.max(0, vaporGenerationKgPerS),
      gasMolarMassKgPerMol: this.c.vacuumVaporMolarMassKgPerMol,
    });
    const vacuumPressureMbar = Math.max(1, vacuum.absolutePressureKPa * 10);
    const leakRise = Math.max(0, this.c.leakRateMbarPerSecond) * dt;
    const pressureWithLeak = Math.min(this.c.ambientPressureMbar, vacuumPressureMbar + leakRise);
    const pressure = this.blend(this.state.pressureMbar, pressureWithLeak, lag);

    const thermal = stepThermalModel({
      initialTemperatureC: this.state.temperatureC,
      ambientTemperatureC: this.c.ambientTemperatureC,
      targetTemperatureC: target.temperatureC,
      thermalMassKJPerC: this.c.thermalMassKJPerC,
      heaterPowerKW: commands.heater ? this.c.heatingPowerKW : 0,
      coolingPowerKW: commands.cooling ? this.c.coolingPowerKW : 0,
      effectiveHeatLossKWPerC: this.c.effectiveHeatLossKWPerC,
      latentHeatLoadKW,
      heaterEfficiency: this.c.heaterRateCPerSecond / DEFAULT_VIRTUAL_HARDWARE_PROFILE.heaterRateCPerSecond,
      coolingEfficiency: this.c.coolingRateCPerSecond / DEFAULT_VIRTUAL_HARDWARE_PROFILE.coolingRateCPerSecond,
    }, dt);

    let temperature = thermal.temperatureC;
    if (commands.condenser) temperature -= this.c.condenserCoolingFactor * dt;
    temperature = Math.max(this.c.ambientTemperatureC, Math.min(200, temperature));
    temperature = this.blend(this.state.temperatureC, temperature, lag);

    const thermalFactor = Math.max(0, Math.min(1, (temperature - this.c.ambientTemperatureC) / 100));
    const vacuumFactor = Math.max(0, Math.min(1, 1 - pressure / this.c.ambientPressureMbar));
    const extractionDrive = commands.extractor ? vacuumFactor * (0.35 + thermalFactor * 0.65) : 0;
    const yieldIncrease = this.c.extractionYieldRatePerSecond * extractionDrive * dt * 100;
    const yieldPercentage = Math.min(target.yieldPercent, this.state.yieldPercent + yieldIncrease);
    const oilRecoveredKg = Math.max(this.state.oilRecoveredKg, target.oilRecoveredKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)));
    const waterRemovedKg = Math.max(this.state.waterRemovedKg, target.waterRemovedKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)));
    const energyRate =
      (commands.heater ? Math.max(0, this.c.heatingPowerKW) / 2250 : 0) +
      (commands.vacuumPump ? 0.0015 : 0) +
      (commands.extractor ? 0.001 : 0) +
      (commands.cooling ? Math.max(0, this.c.coolingPowerKW) / 3000 : 0);

    this.state = { ...this.state, pressureMbar: pressure, temperatureC: temperature, yieldPercent: yieldPercentage,
      waterRemovedKg: Math.min(target.waterRemovedKg, waterRemovedKg), oilRecoveredKg: Math.min(target.oilRecoveredKg, oilRecoveredKg), energyKwh: Math.max(0, this.state.energyKwh + energyRate * dt) };
    return { ...this.state };
  }

  public snapshot(): MachineDynamicsSnapshot { return { state: { ...this.state }, config: { ...this.c } }; }
  public restore(snapshot: MachineDynamicsSnapshot): void { this.state = { ...snapshot.state }; }
  private blend(current: number, next: number, factor: number): number { return current + (next - current) * factor; }
}
