export type PropertySource = {
  sourceId: string;
  citation: string;
  url?: string;
  retrievedAt: string;
  confidence: "PRIMARY" | "REFERENCE" | "ESTIMATED";
};

export type TemperatureRangeC = { min: number; max: number };

export type MaterialPropertyRecord = {
  materialId: string;
  name: string;
  cas?: string;
  basis: "PURE_COMPONENT" | "MIXTURE" | "RAW_BOTANICAL";
  temperatureRangeC?: TemperatureRangeC;
  properties: {
    molecularWeightGPerMol?: number;
    densityKgPerM3?: number;
    heatCapacityJPerKgK?: number;
    latentHeatJPerKg?: number;
    vaporPressurePa?: { temperatureC: number; valuePa: number }[];
  };
  sources: PropertySource[];
  warnings: string[];
};

export type MaterialRegistry = {
  version: string;
  records: MaterialPropertyRecord[];
};

export function registerMaterial(registry: MaterialRegistry, record: MaterialPropertyRecord): MaterialRegistry {
  if (!record.materialId || !record.name || record.sources.length === 0) {
    throw new Error("Material records require identity and at least one provenance source.");
  }
  return {
    ...registry,
    records: [...registry.records.filter((item) => item.materialId !== record.materialId), record],
  };
}

export function getMaterial(registry: MaterialRegistry, materialId: string): MaterialPropertyRecord {
  const record = registry.records.find((item) => item.materialId === materialId);
  if (!record) throw new Error(`Material ${materialId} is not registered.`);
  return record;
}
