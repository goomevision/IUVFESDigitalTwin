/**
 * Dynamic actuator/process coupling for the IUVFES simulator.
 *
 * This is a deterministic simulation layer: actuator commands influence the
 * next sensor frame instead of merely changing UI labels. It is intentionally
 * parameterized and not presented as a validated industrial control model.
 */

import { UltrasonicEngine, type UltrasonicConfig, type UltrasonicState } from './ultrasonicEngine';
import type { MachineCommand, MachineSensors } from './processStateEngine';

export interface VirtualHardwareDynamicsConfig {
  /** Connected vacuum volume, including chamber + piping, in litres. */
  connectedVolumeL: number;
  /** Pump nominal capacity at the current operating condition, m3/h. */
  pumpCapacityM3PerHour: number;
  /** Effective reactor thermal mass, kJ/K. */
  thermalMassKjPerK: number;
  /** Effective heating power delivered to the process, kW. */
  heatingPowerKw: number;
  /** Effective cooling power removed from the process, kW. */
  coolingPowerKw: number;
  /** Leak/load expressed as pressure rise in mbar/s at the current condition. */
  leakRateMbarPerSecond: number;
}

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
  /** Optional physical hardware model. Omit to retain legacy simulation behavior. */
  hardware?: VirtualHardwareDynamicsConfig;
  /** Optional in-situ power-ultrasound model. Omit to preserve the legacy process baseline. */
  ultrasonic?: UltrasonicConfig;
}

export interface MachineDynamicsSnapshot { state: MachineSensors; }

export class MachineDynamicsEngine {
  private readonly c: Required<Omit<DynamicMachineConfig, 'hardware' | 'ultrasonic'>> & {
    hardware?: VirtualHardwareDynamicsConfig;
    ultrasonic?: UltrasonicEngine;
  };
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
      hardware: config.hardware,
      ultrasonic: config.ultrasonic ? new UltrasonicEngine(config.ultrasonic) : undefined,
      ...config,
    };
    this.state = { ...initial };
  }

  public step(target: MachineSensors, commands: MachineCommand, dtSeconds: number): MachineSensors {
    const dt = Math.max(0.05, dtSeconds);
    const lag = Math.max(0.05, Math.min(1, this.c.actuatorLag));
    const hardware = this.c.hardware;
    const ultrasonic = this.c.ultrasonic?.evaluate(this.state.pressureMbar);

    // When a virtual hardware profile is supplied, pressure dynamics depend on
    // connected volume, pump capacity and leak/load. This deliberately remains
    // a reduced-order engineering model; vendor pump curves and vessel analysis
    // are still required before treating it as a physical prediction.
    const hardwarePumpRate = hardware
      ? Math.max(0.001, hardware.pumpCapacityM3PerHour * 1000 / 60 / Math.max(hardware.connectedVolumeL, 0.001))
      : this.c.vacuumRateMbarPerSecond;
    const pumpRate = hardware ? Math.max(0.01, hardwarePumpRate * 0.12) : this.c.vacuumRateMbarPerSecond;
    const leakRate = hardware ? Math.max(0, hardware.leakRateMbarPerSecond) : 0;
    const pressureDemand = commands.vacuumPump
      ? Math.max(1, this.state.pressureMbar - pumpRate * dt + leakRate * dt)
      : this.state.pressureMbar + (this.c.ambientPressureMbar - this.state.pressureMbar) * 0.03 * dt + leakRate * dt;
    const pressure = this.blend(this.state.pressureMbar, Math.max(1, Math.min(this.c.ambientPressureMbar, pressureDemand)), lag);

    let temperature = this.state.temperatureC;
    const ultrasonicHeatingKw = (ultrasonic?.acousticHeatingW ?? 0) / 1000;
    const thermalMassKjPerK = Math.max(0.001, hardware?.thermalMassKjPerK ?? 250);
    if (hardware) {
      if (commands.heater) temperature += ((hardware.heatingPowerKw + ultrasonicHeatingKw) * dt) / thermalMassKjPerK;
      else temperature += (ultrasonicHeatingKw * dt) / thermalMassKjPerK - this.c.passiveHeatLossCPerSecond * dt;
      if (commands.cooling) temperature -= (hardware.coolingPowerKw * dt) / thermalMassKjPerK;
    } else {
      if (commands.heater) temperature += this.c.heaterRateCPerSecond * dt;
      else temperature -= this.c.passiveHeatLossCPerSecond * dt;
      if (ultrasonicHeatingKw > 0) temperature += (ultrasonicHeatingKw * dt) / thermalMassKjPerK;
      if (commands.cooling) temperature -= this.c.coolingRateCPerSecond * dt;
    }
    if (commands.condenser) temperature -= this.c.condenserCoolingFactor * dt;
    temperature = Math.max(this.c.ambientTemperatureC, Math.min(200, temperature));
    temperature = this.blend(this.state.temperatureC, temperature, lag);

    const thermalFactor = Math.max(0, Math.min(1, (temperature - 25) / 100));
    const vacuumFactor = Math.max(0, Math.min(1, 1 - pressure / this.c.ambientPressureMbar));
    const ultrasonicMassTransfer = ultrasonic?.massTransferMultiplier ?? 1;
    const extractionDrive = commands.extractor
      ? vacuumFactor * (0.35 + thermalFactor * 0.65) * ultrasonicMassTransfer
      : 0;
    const yieldIncrease = this.c.extractionYieldRatePerSecond * extractionDrive * dt * 100;
    const yieldPercentage = Math.min(target.yieldPercent, this.state.yieldPercent + yieldIncrease);
    const oilRecoveredKg = Math.max(this.state.oilRecoveredKg, target.oilRecoveredKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)));
    const waterRemovedKg = Math.max(this.state.waterRemovedKg, target.waterRemovedKg * (yieldPercentage / Math.max(target.yieldPercent, 0.001)));
    const ultrasonicEnergyRateKwhPerSecond = ultrasonic
      ? (ultrasonic.electricalPowerW * ultrasonic.dutyCycle) / 1000 / 3600
      : 0;
    const energyRate = (commands.heater ? (hardware?.heatingPowerKw ?? 4) / 1000 : 0)
      + (commands.vacuumPump ? 0.0015 : 0)
      + (commands.extractor ? 0.001 : 0)
      + (commands.cooling ? (hardware?.coolingPowerKw ?? 1) / 1000 : 0)
      + ultrasonicEnergyRateKwhPerSecond;
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

  public getUltrasonicState(staticPressureMbar = this.state.pressureMbar): UltrasonicState | null {
    return this.c.ultrasonic?.evaluate(staticPressureMbar) ?? null;
  }

  public snapshot(): MachineDynamicsSnapshot { return { state: { ...this.state } }; }
  public restore(snapshot: MachineDynamicsSnapshot): void { this.state = { ...snapshot.state }; }
  private blend(current: number, next: number, factor: number): number { return current + (next - current) * factor; }
}
