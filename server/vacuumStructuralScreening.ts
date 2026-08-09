/**
 * Preliminary vacuum-shell structural screening.
 *
 * This is NOT a pressure-vessel code check and must never be presented as
 * certification. It provides an early design-screening signal from geometry
 * and material properties. Final design requires applicable code calculations,
 * shell/head/opening/stiffener/weld assessment and qualified engineering review.
 */

export interface VacuumShellScreeningInput {
  innerDiameterM: number;
  cylindricalLengthM: number;
  wallThicknessM: number;
  designExternalPressureBar: number;
  elasticModulusGPa: number;
  poissonRatio: number;
  yieldStrengthMPa: number;
  safetyFactor: number;
  unsupportedLengthFactor?: number;
}

export interface VacuumShellScreeningResult {
  status: 'PASS_SCREENING' | 'REVIEW_REQUIRED' | 'INVALID_INPUT';
  criticalElasticPressureBar: number | null;
  allowableScreeningPressureBar: number | null;
  utilization: number | null;
  margin: number | null;
  warnings: string[];
  limitations: string[];
}

export function screenVacuumShell(
  input: VacuumShellScreeningInput,
): VacuumShellScreeningResult {
  const warnings: string[] = [];
  const limitations = [
    'Preliminary screening only; not a pressure-vessel code calculation or certification.',
    'Does not assess heads, nozzles, openings, stiffeners, welds, supports, local buckling or fabrication imperfections.',
    'External-pressure stability is sensitive to ovality, unsupported length, boundary conditions and imperfections.',
  ];

  const finitePositive = (value: number) => Number.isFinite(value) && value > 0;
  if (
    !finitePositive(input.innerDiameterM) ||
    !finitePositive(input.cylindricalLengthM) ||
    !finitePositive(input.wallThicknessM) ||
    !Number.isFinite(input.designExternalPressureBar) ||
    !finitePositive(input.elasticModulusGPa) ||
    !Number.isFinite(input.poissonRatio) ||
    input.poissonRatio <= -1 || input.poissonRatio >= 0.5 ||
    !finitePositive(input.yieldStrengthMPa) ||
    !finitePositive(input.safetyFactor)
  ) {
    return { status: 'INVALID_INPUT', criticalElasticPressureBar: null, allowableScreeningPressureBar: null, utilization: null, margin: null, warnings: ['Invalid structural screening input.'], limitations };
  }

  if (input.wallThicknessM >= input.innerDiameterM / 2) {
    return { status: 'INVALID_INPUT', criticalElasticPressureBar: null, allowableScreeningPressureBar: null, utilization: null, margin: null, warnings: ['Wall thickness is not compatible with the thin-shell screening model.'], limitations };
  }

  const tOverD = input.wallThicknessM / input.innerDiameterM;
  const unsupportedFactor = input.unsupportedLengthFactor ?? 1;
  const E = input.elasticModulusGPa * 1e9;
  const pcrPa = (2 * E / Math.sqrt(3 * (1 - input.poissonRatio ** 2))) * tOverD ** 3 / Math.max(unsupportedFactor, 0.1);
  const criticalElasticPressureBar = pcrPa / 1e5;
  const allowableScreeningPressureBar = criticalElasticPressureBar / input.safetyFactor;
  const utilization = input.designExternalPressureBar / Math.max(allowableScreeningPressureBar, Number.EPSILON);
  const margin = allowableScreeningPressureBar / Math.max(input.designExternalPressureBar, Number.EPSILON) - 1;

  if (input.cylindricalLengthM / input.innerDiameterM > 10) {
    warnings.push('High aspect ratio; unsupported length requires detailed stability analysis.');
  }
  if (tOverD > 0.05) {
    warnings.push('Shell is outside the intended thin-shell screening range; use a qualified detailed method.');
  }
  if (input.designExternalPressureBar <= 0) {
    warnings.push('No positive external-pressure design case supplied.');
  }
  if (utilization > 1) {
    warnings.push('Design external pressure exceeds the preliminary screening allowable.');
  } else if (utilization > 0.8) {
    warnings.push('High screening utilization; detailed engineering review required.');
  }

  return {
    status: utilization <= 0.8 ? 'PASS_SCREENING' : 'REVIEW_REQUIRED',
    criticalElasticPressureBar,
    allowableScreeningPressureBar,
    utilization,
    margin,
    warnings,
    limitations,
  };
}
