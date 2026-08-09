import { deriveCylindricalChamber, type CylindricalChamberGeometry } from './virtualHardwareGeometry';
import type { ThermalModelConfig } from './thermalEngineering';

export interface ThermalMaterialProperties {
  densityKgPerM3: number;
  specificHeatKJPerKgC: number;
  thermalConductivityWPerMK: number;
}

export interface ThermalInsulationProperties {
  thicknessM: number;
  conductivityWPerMK: number;
}

export interface ThermalHardwareInput {
  geometry: CylindricalChamberGeometry;
  material: ThermalMaterialProperties;
  insulation?: ThermalInsulationProperties;
  internalFluidMassKg?: number;
  internalFluidSpecificHeatKJPerKgC?: number;
  jacketEfficiency?: number;
}

export interface CoupledThermalHardwareResult {
  effectiveThermalMassKJPerC: number;
  effectiveHeatTransferAreaM2: number;
  estimatedHeatLossCoefficientKWPerC: number;
  modelConfig: ThermalModelConfig;
  derivedShellMassKg: number;
}

/**
 * Deterministic first-order thermal coupling from physical geometry/material
 * properties into the lumped thermal model. This is not CFD or a structural
 * thermal-stress calculation.
 */
export function buildCoupledThermalModel(input: ThermalHardwareInput): CoupledThermalHardwareResult {
  const geometry = deriveCylindricalChamber(input.geometry, input.material.densityKgPerM3);
  const shellMassKg = geometry.shellMetalMassKg ?? 0;
  const shellThermalMass = shellMassKg * input.material.specificHeatKJPerKgC;
  const fluidThermalMass =
    Math.max(0, input.internalFluidMassKg ?? 0) * Math.max(0, input.internalFluidSpecificHeatKJPerKgC ?? 0);
  const effectiveThermalMassKJPerC = Math.max(0.001, shellThermalMass + fluidThermalMass);

  const insulation = input.insulation;
  const baseArea = geometry.internalSurfaceAreaM2;
  const insulationResistance = insulation && insulation.thicknessM > 0 && insulation.conductivityWPerMK > 0
    ? insulation.thicknessM / (insulation.conductivityWPerMK * Math.max(baseArea, 1e-9))
    : 0;
  const effectiveHeatTransferAreaM2 = baseArea * Math.max(0, Math.min(1, input.jacketEfficiency ?? 1));
  const estimatedHeatLossCoefficientKWPerC = insulationResistance > 0
    ? (1 / insulationResistance) / 1000
    : effectiveHeatTransferAreaM2 * 0.01;

  return {
    effectiveThermalMassKJPerC,
    effectiveHeatTransferAreaM2,
    estimatedHeatLossCoefficientKWPerC,
    modelConfig: {
      thermalMassKJPerC: effectiveThermalMassKJPerC,
      heatLossKWPerC: estimatedHeatLossCoefficientKWPerC,
    },
    derivedShellMassKg: shellMassKg,
  };
}
