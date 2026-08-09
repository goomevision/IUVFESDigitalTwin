/**
 * Canonical virtual-hardware baseline for the closed-loop simulator.
 *
 * These are simulation defaults only. They are intentionally centralized so
 * the coordinator does not contain hidden physical constants. Production
 * engineering values must be supplied explicitly with provenance.
 */
import type { DynamicMachineConfig } from './machineDynamics';

export const DEFAULT_VIRTUAL_HARDWARE_PROFILE: Readonly<Required<DynamicMachineConfig>> = {
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
};

export function resolveVirtualHardwareProfile(
  overrides: Partial<DynamicMachineConfig> = {},
): Required<DynamicMachineConfig> {
  return { ...DEFAULT_VIRTUAL_HARDWARE_PROFILE, ...overrides };
}
