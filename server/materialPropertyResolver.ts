/**
 * Condition-aware resolver for the Scientific Material Knowledge Base.
 *
 * The resolver never invents missing properties. It returns DATA_GAP when a
 * requested property surface is not represented by evidence in the catalog.
 */

export type MaterialResolutionStatus = 'RESOLVED' | 'DATA_GAP' | 'UNSUPPORTED_STATE';

export interface MaterialCondition {
  state?: string;
  temperatureC?: number;
  pressureMbar?: number;
  moisturePercent?: number;
}

export interface MaterialPropertyPoint {
  name: string;
  value?: number;
  unit?: string;
  referenceTemperatureK?: number;
  temperaturePointsC?: number[];
  values?: number[];
  conditionDependent?: boolean;
  source?: string;
  sourceUrl?: string;
}

export interface MaterialCatalogRecord {
  materialId: string;
  name: string;
  states: string[];
  evidenceGrade: string;
  validationStatus: string;
  properties: MaterialPropertyPoint[];
  dataGaps: string[];
}

export interface ResolvedMaterialProperty {
  materialId: string;
  property: string;
  status: MaterialResolutionStatus;
  value?: number;
  unit?: string;
  source?: string;
  sourceUrl?: string;
  interpolated?: boolean;
  reason?: string;
}

export function interpolateLinear(x: number, xs: readonly number[], ys: readonly number[]): number | null {
  if (xs.length !== ys.length || xs.length === 0 || !Number.isFinite(x)) return null;
  if (xs.length === 1) return x === xs[0] ? ys[0] : null;

  const pairs = xs.map((value, index) => ({ x: value, y: ys[index] })).sort((a, b) => a.x - b.x);
  if (x < pairs[0].x || x > pairs[pairs.length - 1].x) return null;

  for (let i = 0; i < pairs.length - 1; i += 1) {
    const left = pairs[i];
    const right = pairs[i + 1];
    if (x >= left.x && x <= right.x) {
      if (right.x === left.x) return left.y;
      const fraction = (x - left.x) / (right.x - left.x);
      return left.y + fraction * (right.y - left.y);
    }
  }
  return null;
}

export function resolveMaterialProperty(
  material: MaterialCatalogRecord,
  propertyName: string,
  condition: MaterialCondition = {},
): ResolvedMaterialProperty {
  if (condition.state && !material.states.includes(condition.state)) {
    return {
      materialId: material.materialId,
      property: propertyName,
      status: 'UNSUPPORTED_STATE',
      reason: `State ${condition.state} is not represented by the material evidence catalog.`,
    };
  }

  const property = material.properties.find((candidate) => candidate.name === propertyName);
  if (!property) {
    return {
      materialId: material.materialId,
      property: propertyName,
      status: 'DATA_GAP',
      reason: material.dataGaps.find((gap) => gap.toLowerCase().includes(propertyName.toLowerCase()))
        ?? 'No evidence-backed property surface is available.',
    };
  }

  if (property.value !== undefined) {
    if (property.referenceTemperatureK !== undefined && condition.temperatureC !== undefined) {
      const referenceC = property.referenceTemperatureK - 273.15;
      if (Math.abs(referenceC - condition.temperatureC) > 1e-9) {
        return {
          materialId: material.materialId,
          property: propertyName,
          status: 'DATA_GAP',
          unit: property.unit,
          source: property.source,
          sourceUrl: property.sourceUrl,
          reason: `Evidence is available only at ${referenceC.toFixed(2)} °C; no temperature-dependent surface is provided.`,
        };
      }
    }

    return {
      materialId: material.materialId,
      property: propertyName,
      status: 'RESOLVED',
      value: property.value,
      unit: property.unit,
      source: property.source,
      sourceUrl: property.sourceUrl,
    };
  }

  if (condition.temperatureC !== undefined && property.temperaturePointsC && property.values) {
    const value = interpolateLinear(condition.temperatureC, property.temperaturePointsC, property.values);
    if (value !== null) {
      return {
        materialId: material.materialId,
        property: propertyName,
        status: 'RESOLVED',
        value,
        unit: property.unit,
        source: property.source,
        sourceUrl: property.sourceUrl,
        interpolated: true,
      };
    }
  }

  return {
    materialId: material.materialId,
    property: propertyName,
    status: 'DATA_GAP',
    unit: property.unit,
    source: property.source,
    sourceUrl: property.sourceUrl,
    reason: condition.temperatureC === undefined
      ? 'A temperature condition is required to resolve this tabulated property.'
      : 'Requested condition lies outside the evidence-backed temperature range.',
  };
}

export function resolveMaterialProperties(
  material: MaterialCatalogRecord,
  propertyNames: readonly string[],
  condition: MaterialCondition = {},
): ResolvedMaterialProperty[] {
  return propertyNames.map((propertyName) => resolveMaterialProperty(material, propertyName, condition));
}
