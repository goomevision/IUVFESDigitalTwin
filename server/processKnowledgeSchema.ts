export type ProcessHistory = {
  preTreatment?: "NONE" | "FREEZING" | "DRYING" | "OTHER";
  preTreatmentTemperatureC?: number;
  preTreatmentDurationS?: number;
  storageDurationS?: number;
};

export type ProcessStateSnapshot = {
  physicalTimeS: number;
  temperatureC: number;
  absolutePressurePa: number;
  materialMassKg: number;
  moistureKg?: number;
  lipidKg?: number;
  addedWaterKg?: number;
  mediumWaterVolumeL?: number;
  heaterPowerW: number;
  vacuumPumpPowerW: number;
  vibrationPowerW?: number;
  cumulativeEnergyWh: number;
  phaseState: "LIQUID" | "ICE" | "VAPOR" | "MIXED";
};

export type ProcessKnowledgeRecord = {
  recordId: string;
  materialId: string;
  history: ProcessHistory;
  snapshots: ProcessStateSnapshot[];
  evidenceIds: string[];
  modelRevisionId: string;
};
