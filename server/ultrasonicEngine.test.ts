import { describe, expect, it } from 'vitest';
import { UltrasonicEngine } from './ultrasonicEngine';
import { MachineDynamicsEngine } from './machineDynamics';
import type { MachineCommand, MachineSensors } from './processStateEngine';

const initial: MachineSensors = {
  chamberSealed: true,
  pressureMbar: 50,
  temperatureC: 60,
  yieldPercent: 0,
  waterRemovedKg: 0,
  oilRecoveredKg: 0,
  energyKwh: 0,
};

const extractionCommand: MachineCommand = {
  heater: true,
  vacuumPump: true,
  extractor: true,
  condenser: true,
  cooling: false,
};

const target: MachineSensors = {
  ...initial,
  yieldPercent: 100,
  waterRemovedKg: 2,
  oilRecoveredKg: 1,
};

describe('ultrasonic physics kernel', () => {
  it('derives wavelength, acoustic power, intensity and pressure from physical inputs', () => {
    const engine = new UltrasonicEngine({
      frequencyHz: 20_000,
      electricalPowerW: 100,
      transducerEfficiency: 0.6,
      activeAreaM2: 0.01,
    });
    const state = engine.evaluate(50);

    expect(state.acousticPowerW).toBeCloseTo(60, 8);
    expect(state.wavelengthM).toBeCloseTo(1497 / 20_000, 8);
    expect(state.acousticIntensityWm2).toBeCloseTo(6_000, 6);
    expect(state.acousticPressureAmplitudePa).toBeGreaterThan(0);
    expect(state.peakNegativePressurePa).toBeGreaterThan(state.staticPressurePa - state.vaporPressurePa);
    expect(state.modelStatus).toBe('DATA_GAP');
  });

  it('couples vacuum pressure to cavitation drive instead of treating ultrasound as a UI-only value', () => {
    const engine = new UltrasonicEngine({
      frequencyHz: 20_000,
      electricalPowerW: 100,
      transducerEfficiency: 0.6,
      activeAreaM2: 0.01,
    });

    const atmospheric = engine.evaluate(1013.25);
    const vacuum = engine.evaluate(50);

    expect(vacuum.cavitationActivity).toBeGreaterThan(atmospheric.cavitationActivity);
    expect(vacuum.cavitationThresholdMarginPa).toBeGreaterThan(atmospheric.cavitationThresholdMarginPa);
  });

  it('couples ultrasound to extraction and energy accounting in MachineDynamics', () => {
    const baseline = new MachineDynamicsEngine(initial);
    const ultrasonic = new MachineDynamicsEngine(initial, {
      ultrasonic: {
        frequencyHz: 20_000,
        electricalPowerW: 100,
        transducerEfficiency: 0.6,
        activeAreaM2: 0.01,
      },
    });

    const baselineFrame = baseline.step(target, extractionCommand, 1);
    const ultrasonicFrame = ultrasonic.step(target, extractionCommand, 1);

    expect(ultrasonicFrame.yieldPercent).toBeGreaterThan(baselineFrame.yieldPercent);
    expect(ultrasonicFrame.energyKwh).toBeGreaterThan(baselineFrame.energyKwh);
    expect(['ACTIVE', 'UNSTABLE']).toContain(ultrasonic.getUltrasonicState(50)?.cavitationStatus);
  });

  it('supports pulsed operation without changing the base process equations', () => {
    const continuous = new UltrasonicEngine({
      frequencyHz: 40_000,
      electricalPowerW: 100,
      transducerEfficiency: 0.6,
      activeAreaM2: 0.01,
      dutyCycle: 1,
    }).evaluate(50);
    const pulsed = new UltrasonicEngine({
      frequencyHz: 40_000,
      electricalPowerW: 100,
      transducerEfficiency: 0.6,
      activeAreaM2: 0.01,
      dutyCycle: 0.5,
    }).evaluate(50);

    expect(pulsed.acousticPowerW).toBeCloseTo(continuous.acousticPowerW * 0.5, 8);
    expect(pulsed.acousticIntensityWm2).toBeCloseTo(continuous.acousticIntensityWm2 * 0.5, 8);
    expect(pulsed.acousticPressureAmplitudePa).toBeCloseTo(continuous.acousticPressureAmplitudePa / Math.sqrt(2), 6);
  });
});
