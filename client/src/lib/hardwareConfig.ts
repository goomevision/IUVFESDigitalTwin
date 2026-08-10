export interface ControlHardwareConfig {
  chamberVolumeL: number;
  pumpCapacityM3h: number;
  thermalMassKJPerC: number;
  heatingPowerKW: number;
  coolingPowerKW: number;
  leakRateMbarPerSecond: number;
}

export const HARDWARE_CONFIG_STORAGE_KEY = "iuvfes.hardware.static.v1";

export const DEFAULT_CONTROL_HARDWARE_CONFIG: ControlHardwareConfig = {
  chamberVolumeL: 250,
  pumpCapacityM3h: 200,
  thermalMassKJPerC: 250,
  heatingPowerKW: 9,
  coolingPowerKW: 3,
  leakRateMbarPerSecond: 0,
};

export function loadControlHardwareConfig(): ControlHardwareConfig {
  if (typeof window === "undefined") return DEFAULT_CONTROL_HARDWARE_CONFIG;
  try {
    const raw = window.localStorage.getItem(HARDWARE_CONFIG_STORAGE_KEY);
    if (!raw) return DEFAULT_CONTROL_HARDWARE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ControlHardwareConfig>;
    return {
      ...DEFAULT_CONTROL_HARDWARE_CONFIG,
      ...parsed,
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
