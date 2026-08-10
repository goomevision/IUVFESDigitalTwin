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

  // Hardware limits / installed capacity.
  pumpCapacityM3h: number;
  heatingPowerKW: number;
  coolingPowerKW: number;
  thermalMassKJPerC: number;
  leakRateMbarPerSecond: number;
  ultrasonicFrequencyKHz: number;
  ultrasonicMaxPowerKW: number;
  coldTrapTemperaturesC: [number, number, number, number];
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
  pumpCapacityM3h: 200,
  heatingPowerKW: 9,
  coolingPowerKW: 3,
  thermalMassKJPerC: 250,
  leakRateMbarPerSecond: 0,
  ultrasonicFrequencyKHz: 30,
  ultrasonicMaxPowerKW: 6,
  coldTrapTemperaturesC: [0, -20, -40, -80],
};

export function loadControlHardwareConfig(): ControlHardwareConfig {
  if (typeof window === "undefined") return DEFAULT_CONTROL_HARDWARE_CONFIG;
  try {
    const raw = window.localStorage.getItem(HARDWARE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROL_HARDWARE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ControlHardwareConfig>;
    const traps = Array.isArray(parsed.coldTrapTemperaturesC) ? parsed.coldTrapTemperaturesC : DEFAULT_CONTROL_HARDWARE_CONFIG.coldTrapTemperaturesC;
    return {
      ...DEFAULT_CONTROL_HARDWARE_CONFIG,
      ...parsed,
      coldTrapTemperaturesC: [Number(traps[0]), Number(traps[1]), Number(traps[2]), Number(traps[3])] as [number, number, number, number],
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
