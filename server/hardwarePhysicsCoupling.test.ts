import { describe, expect, it } from 'vitest';
import { deriveCylindricalChamber } from './virtualHardwareGeometry';
import { deriveVacuumConductance, combinePumpAndConductance } from './vacuumConductance';
import { calculateColdTrapLoad } from './coldTrapEngineering';
import { enforceUltrasonicHardwareLimits } from './ultrasonicHardwareCoupling';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineSensors } from './processStateEngine';

const initial: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 200,
  temperatureC: 60,
  yieldPercent: 0,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
};

const target: MachineSensors = {
  ...initial,
  pressureMbar: 120,
  temperatureC: 60,
  yieldPercent: 100,
  waterRemovedKg: 2,
  oilRecoveredKg: 0.5,
};

const vacuumCommand = { chamberSealed: true, heater: false, cooling: false, condenser: false, extractor: false, vacuumPump: true };

describe('hardware physics coupling', () => {
  it('derives reactor volume from diameter and shell length', () => {
    const result = deriveCylindricalChamber({ innerDiameterM: 1, cylindricalLengthM: 1, wallThicknessM: 0.01 });
    expect(result.internalVolumeL).toBeCloseTo(Math.PI * 1000, 6);
  });

  it('reduces effective pumping speed when piping conductance is restrictive', () => {
    const result = deriveVacuumConductance({ pipeDiameterM: 0.02, pipeLengthM: 20, upstreamPressureMbar: 120, downstreamPressureMbar: 1 });
    const effective = combinePumpAndConductance(200, result.conductanceM3PerHour);
    expect(result.conductanceM3PerHour).toBeGreaterThan(0);
    expect(effective).toBeLessThan(200);
  });

  it('cold-trap temperature and area create a finite thermal condensation capacity', () => {
    const result = calculateColdTrapLoad(
      { temperatureC: -40, volumeL: 2, heatTransferAreaM2: 1.5, condensateCapacityKg: 2 },
      { streamTemperatureC: 60, dtSeconds: 1, incomingCondensableKg: 0.1, overallHeatTransferCoefficientWPerM2K: 100 },
    );
    expect(result.heatRemovalKW).toBeGreaterThan(0);
    expect(result.thermalCapacityKgPerSecond).toBeGreaterThan(0);
    expect(result.condensedKg).toBeGreaterThan(0);
  });

  it('ultrasonic request cannot exceed installed maximum power', () => {
    const result = enforceUltrasonicHardwareLimits({
      installedFrequencyMinKHz: 20,
      installedFrequencyMaxKHz: 40,
      installedMaxPowerKW: 6,
      operatingFrequencyKHz: 30,
      requestedPowerKW: 9,
      workingVolumeL: 250,
    });
    expect(result.effectivePowerKW).toBe(6);
    expect(result.powerLimited).toBe(true);
  });

  it('machine dynamics exposes piping-derived vacuum diagnostics', () => {
    const restricted = new MachineDynamicsEngine(initial, {
      chamberVolumeL: 250,
      pumpCapacityM3h: 200,
      vacuumPipeDiameterMm: 20,
      vacuumPipeLengthM: 20,
      vacuumPumpOutletPressureMbar: 1,
      thermalMassKJPerC: 250,
      heatingPowerKW: 9,
      coolingPowerKW: 3,
      leakRateMbarPerSecond: 0,
    });
    const frame = restricted.step(target, vacuumCommand, 1);
    expect(frame.vacuumConductanceM3h).toBeGreaterThan(0);
    expect(frame.effectivePumpCapacityM3h).toBeLessThan(200);
    expect(frame.connectedVolumeL).toBeGreaterThan(250);
  });
});
