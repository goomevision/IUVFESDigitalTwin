export interface ControlHardwareConfig {
  // Static engineering specification (locked during operation).
  reactorInternalDiameterMm: number;
  reactorShellLengthMm: number;
  reactorWallThicknessMm: number;
  reactorHeadThicknessMm: number;
  reactorMaterial: string;
  designExternalPressureBar: number;
  designTemperatureC: number;
  chamberVolumeL: number;

  // Vacuum line geometry.
  vacuumPipeDiameterMm: number;
  vacuumPipeLengthM: number;
  vacuumPipeEffectiveLengthFactor: number;
  vacuumPumpOutletPressureMbar: number;

  // Hardware limits / installed capacity.
  pumpCapacityM3h: number;
  heatingPowerKW: number;
  coolingPowerKW: number;
  thermalMassKJPerC: number;
  leakRateMbarPerSecond: number;
  ultrasonicFrequencyKHz: number;
  ultrasonicMaxPowerKW: number;

  // Cold-trap static geometry/capacity.
  coldTrapTemperaturesC: [number, number, number, number];
  coldTrapHeatTransferCoefficientWPerM2K: number;
  coldTrapHeatTransferAreasM2: [number, number, number, number];
  coldTrapVolumesL: [number, number, number, number];
  coldTrapCondensateCapacityKg: [number, number, number, number];
}

export const HARDWARE_CONFIG_STORAGE_KEY = "iuvfes.hardware.static.v1";

export const DEFAULT_CONTROL_HARDWARE_CONFIG: ControlHardwareConfig = {
  reactorInternalDiameterMm: 1000,
  reactorShellLengthMm: 1500,
  reactorWallThicknessMm: 10,
  reactorHeadThicknessMm: 10,
  reactorMaterial: "SS316L",
  designExternalPressureBar: 0,
  designTemperatureC: 100,
  chamberVolumeL: 250,
  vacuumPipeDiameterMm: 40,
  vacuumPipeLengthM: 18.6,
  vacuumPipeEffectiveLengthFactor: 1,
  vacuumPumpOutletPressureMbar: 1,
  pumpCapacityM3h: 200,
  heatingPowerKW: 9,
  coolingPowerKW: 3,
  thermalMassKJPerC: 250,
  leakRateMbarPerSecond: 0,
  ultrasonicFrequencyKHz: 30,
  ultrasonicMaxPowerKW: 6,
  coldTrapTemperaturesC: [0, -20, -40, -80],
  coldTrapHeatTransferCoefficientWPerM2K: 0,
  coldTrapHeatTransferAreasM2: [1.2, 1.2, 1.5, 1.8],
  coldTrapVolumesL: [2, 2, 2, 2],
  coldTrapCondensateCapacityKg: [2, 2, 2, 2],
};

export function loadControlHardwareConfig(): ControlHardwareConfig {
  if (typeof window === "undefined") return DEFAULT_CONTROL_HARDWARE_CONFIG;
  try {
    const raw = window.localStorage.getItem(HARDWARE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROL_HARDWARE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ControlHardwareConfig>;
    const traps = Array.isArray(parsed.coldTrapTemperaturesC) ? parsed.coldTrapTemperaturesC : DEFAULT_CONTROL_HARDWARE_CONFIG.coldTrapTemperaturesC;
    const areas = Array.isArray(parsed.coldTrapHeatTransferAreasM2) ? parsed.coldTrapHeatTransferAreasM2 : DEFAULT_CONTROL_HARDWARE_CONFIG.coldTrapHeatTransferAreasM2;
    const volumes = Array.isArray(parsed.coldTrapVolumesL) ? parsed.coldTrapVolumesL : DEFAULT_CONTROL_HARDWARE_CONFIG.coldTrapVolumesL;
    const capacities = Array.isArray(parsed.coldTrapCondensateCapacityKg) ? parsed.coldTrapCondensateCapacityKg : DEFAULT_CONTROL_HARDWARE_CONFIG.coldTrapCondensateCapacityKg;
    return {
      ...DEFAULT_CONTROL_HARDWARE_CONFIG,
      ...parsed,
      coldTrapTemperaturesC: [Number(traps[0]), Number(traps[1]), Number(traps[2]), Number(traps[3])] as [number, number, number, number],
      coldTrapHeatTransferAreasM2: [Number(areas[0]), Number(areas[1]), Number(areas[2]), Number(areas[3])] as [number, number, number, number],
      coldTrapVolumesL: [Number(volumes[0]), Number(volumes[1]), Number(volumes[2]), Number(volumes[3])] as [number, number, number, number],
      coldTrapCondensateCapacityKg: [Number(capacities[0]), Number(capacities[1]), Number(capacities[2]), Number(capacities[3])] as [number, number, number, number],
    };
  } catch {
    return DEFAULT_CONTROL_HARDWARE_CONFIG;
  }
}

export function saveControlHardwareConfig(config: ControlHardwareConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HARDWARE_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function clearControlHardwareConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(HARDWARE_CONFIG_STORAGE_KEY);
}