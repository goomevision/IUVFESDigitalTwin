/**
 * Dynamic actuator/process coupling for the IUVFES simulator.
 *
 * Hardware inputs are virtual engineering parameters. They influence the
 * deterministic process model but are not safety certification or a validated
 * industrial control model. Physical design values must retain provenance.
 */

import type { MachineCommand, MachineSensors } from './processStateEngine';
import { stepThermalModel } from './thermalEngineering';
import { deriveVacuumConductance, combinePumpAndConductance } from './vacuumConductance';
import { calculateColdTrapLoad } from './coldTrapEngineering';
import { enforceUltrasonicHardwareLimits } from './ultrasonicHardwareCoupling';

export interface VirtualHardwareDynamicsConfig {
  /** Static engineering specification retained with the session snapshot. */
  reactorInternalDiameterMm?: number;
  reactorShellLengthMm?: number;
  reactorWallThicknessMm?: number;
  reactorHeadThicknessMm?: number;
  reactorMaterial?: string;
  designExternalPressureBar?: number;
  designTemperatureC?: number;
  ultrasonicFrequencyKHz?: number;
  ultrasonicMaxPowerKW?: number;
  coldTrapTemperaturesC?: [number, number, number, number];
  /** Connected reactor/vacuum volume in litres. */
  chamberVolumeL?: number;
  /** Main vacuum pipe inside diameter. */
  vacuumPipeDiameterMm?: number;
  /** Main vacuum pipe axial length. */
  vacuumPipeLengthM?: number;
  /** Effective-length multiplier for bends/fittings. */
  vacuumPipeEffectiveLengthFactor?: number;
  /** Gas viscosity used by the laminar conductance screening model. */
  vacuumGasViscosityPaS?: number;
  /** Pump-side pressure used for the conductance screening model. */
  vacuumPumpOutletPressureMbar?: number;
  /** Installed cold-trap overall heat-transfer coefficient. */
  coldTrapHeatTransferCoefficientWPerM2K?: number;
  coldTrapHeatTransferAreasM2?: [number, number, number, number];
  coldTrapVolumesL?: [number, number, number, number];
  coldTrapCondensateCapacityKg?: [number, number, number, number];
  /** Dynamic ultrasonic request; static hardware max remains immutable. */
  ultrasonicOperatingFrequencyKHz?: number;
  ultrasonicRequestedPowerKW?: number;
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
      reactorInternalDiameterMm: 1000,
      reactorShellLengthMm: 1500,
      reactorWallThicknessMm: 10,
      reactorHeadThicknessMm: 10,
      reactorMaterial: 'SS316L',
      designExternalPressureBar: 0,
      designTemperatureC: 100,
      ultrasonicFrequencyKHz: 30,
      ultrasonicMaxPowerKW: 6,
      coldTrapTemperaturesC: [0, -20, -40, -80],
      chamberVolumeL: 250,
      vacuumPipeDiameterMm: 0,
      vacuumPipeLengthM: 0,
      vacuumPipeEffectiveLengthFactor: 1,
      vacuumGasViscosityPaS: 1.81e-5,
      vacuumPumpOutletPressureMbar: 1,
      coldTrapHeatTransferCoefficientWPerM2K: 0,
      coldTrapHeatTransferAreasM2: [0, 0, 0, 0],
      coldTrapVolumesL: [0, 0, 0, 0],
      coldTrapCondensateCapacityKg: [0, 0, 0, 0],
      ultrasonicOperatingFrequencyKHz: 30,
      ultrasonicRequestedPowerKW: 0,
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

    const pipeConfigured = this.c.vacuumPipeDiameterMm > 0 && this.c.vacuumPipeLengthM > 0;
    const pipe = pipeConfigured
      ? deriveVacuumConductance({
          pipeDiameterM: this.c.vacuumPipeDiameterMm / 1000,
          pipeLengthM: this.c.vacuumPipeLengthM,
          upstreamPressureMbar: Math.max(this.state.pressureMbar, this.c.vacuumPumpOutletPressureMbar),
          downstreamPressureMbar: this.c.vacuumPumpOutletPressureMbar,
          gasViscosityPaS: this.c.vacuumGasViscosityPaS,
          effectiveLengthFactor: this.c.vacuumPipeEffectiveLengthFactor,
        })
      : null;
    const pipeVolumeL = pipe?.pipeVolumeM3 ? pipe.pipeVolumeM3 * 1000 : 0;
    const connectedVolumeL = Math.max(1, this.c.chamberVolumeL + pipeVolumeL);
    const effectivePumpCapacityM3h = pipe
      ? combinePumpAndConductance(this.c.pumpCapacityM3h, pipe.conductanceM3PerHour)
      : this.c.pumpCapacityM3h;

    // Vacuum response keeps the original 250 L / 200 m³/h reference model,
    // while connected volume and effective pump speed now come from hardware.
    const volumeFactor = 250 / connectedVolumeL;
    const pumpFactor = effectivePumpCapacityM3h / 200;
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

    const ultrasonic = enforceUltrasonicHardwareLimits({
      installedFrequencyMinKHz: Math.max(0.001, this.c.ultrasonicFrequencyKHz),
      installedFrequencyMaxKHz: Math.max(0.001, this.c.ultrasonicFrequencyKHz),
      installedMaxPowerKW: Math.max(0, this.c.ultrasonicMaxPowerKW),
      operatingFrequencyKHz: this.c.ultrasonicOperatingFrequencyKHz,
      requestedPowerKW: commands.extractor ? this.c.ultrasonicRequestedPowerKW : 0,
      workingVolumeL: connectedVolumeL,
    });

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

    const previousWater = this.state.waterRemovedKg;
    const incomingCondensableKg = Math.max(0, waterRemovedKg - previousWater);
    let remainingCondensableKg = incomingCondensableKg;
    let coldTrapHeatLoadKW = 0;
    let coldTrapCondensationCapacityKgPerSecond = 0;
    let coldTrapCondensedWaterKg = this.state.coldTrapCondensedWaterKg ?? 0;
    let aggregateCapacityRemainingKg = Math.max(0, this.c.coldTrapCondensateCapacityKg.reduce((sum, value) => sum + value, 0) - coldTrapCondensedWaterKg);
    const trapTemps = this.c.coldTrapTemperaturesC;
    const areas = this.c.coldTrapHeatTransferAreasM2;
    const volumes = this.c.coldTrapVolumesL;
    const capacities = this.c.coldTrapCondensateCapacityKg;
    for (let i = 0; i < 4 && remainingCondensableKg > 0 && aggregateCapacityRemainingKg > 0; i += 1) {
      const stageCapacity = Math.min(capacities[i], aggregateCapacityRemainingKg);
      const trap = calculateColdTrapLoad(
        {
          temperatureC: trapTemps[i],
          volumeL: volumes[i],
          heatTransferAreaM2: areas[i],
          condensateCapacityKg: Math.max(0, stageCapacity),
        },
        {
          streamTemperatureC: temperature,
          dtSeconds: dt,
          incomingCondensableKg: remainingCondensableKg,
          overallHeatTransferCoefficientWPerM2K: this.c.coldTrapHeatTransferCoefficientWPerM2K,
        },
      );
      coldTrapHeatLoadKW += trap.heatRemovalKW;
      coldTrapCondensationCapacityKgPerSecond += trap.thermalCapacityKgPerSecond;
      coldTrapCondensedWaterKg += trap.condensedKg;
      aggregateCapacityRemainingKg = Math.max(0, aggregateCapacityRemainingKg - trap.condensedKg);
      remainingCondensableKg = trap.remainingIncomingKg;
    }

    const energyRate =
      (commands.heater ? Math.max(0, this.c.heatingPowerKW) / 2250 : 0) +
      (commands.vacuumPump ? 0.0015 : 0) +
      (commands.extractor ? 0.001 : 0) +
      (commands.cooling ? Math.max(0, this.c.coolingPowerKW) / 3000 : 0) +
      (ultrasonic.effectivePowerKW > 0 ? ultrasonic.effectivePowerKW / 3600 : 0);
    const energyConsumed = this.state.energyKwh + energyRate * dt;

    this.state = {
      ...this.state,
      pressureMbar: pressure,
      temperatureC: temperature,
      yieldPercent: yieldPercentage,
      waterRemovedKg: Math.min(target.waterRemovedKg, waterRemovedKg),
      oilRecoveredKg: Math.min(target.oilRecoveredKg, oilRecoveredKg),
      energyKwh: Math.max(0, energyConsumed),
      connectedVolumeL,
      pipeVolumeL,
      vacuumConductanceM3h: pipe?.conductanceM3PerHour,
      effectivePumpCapacityM3h,
      ultrasonicEffectivePowerKW: ultrasonic.effectivePowerKW,
      ultrasonicPowerDensityWPerL: ultrasonic.powerDensityWPerL,
      coldTrapHeatLoadKW,
      coldTrapCondensationCapacityKgPerSecond,
      coldTrapCondensedWaterKg,
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