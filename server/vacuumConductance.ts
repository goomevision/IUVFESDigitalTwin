/**
 * Reduced-order vacuum-line conductance model.
 *
 * The laminar conductance relation is pressure dependent. It is used here as
 * an engineering screening model only; transitional and molecular regimes,
 * fittings, valves and vendor pump curves require a detailed vacuum model.
 */

export interface VacuumConductanceInput {
  pipeDiameterM: number;
  pipeLengthM: number;
  upstreamPressureMbar: number;
  downstreamPressureMbar: number;
  gasViscosityPaS?: number;
  effectiveLengthFactor?: number;
}

export interface VacuumConductanceResult {
  pipeVolumeM3: number;
  crossSectionAreaM2: number;
  meanPressurePa: number;
  conductanceM3PerS: number;
  conductanceM3PerHour: number;
  effectiveLengthM: number;
  status: 'REDUCED_ORDER_LAMINAR_SCREENING' | 'INVALID_INPUT';
  warnings: string[];
}

export function deriveVacuumConductance(input: VacuumConductanceInput): VacuumConductanceResult {
  const warnings: string[] = [];
  const d = input.pipeDiameterM;
  const L = input.pipeLengthM;
  const p1 = input.upstreamPressureMbar;
  const p2 = input.downstreamPressureMbar;
  const mu = input.gasViscosityPaS ?? 1.81e-5;
  const lengthFactor = Math.max(1, input.effectiveLengthFactor ?? 1);
  const effectiveLengthM = L * lengthFactor;

  if (![d, L, p1, p2, mu].every(Number.isFinite) || d <= 0 || L <= 0 || mu <= 0 || p1 < 0 || p2 < 0) {
    return {
      pipeVolumeM3: 0,
      crossSectionAreaM2: 0,
      meanPressurePa: 0,
      conductanceM3PerS: 0,
      conductanceM3PerHour: 0,
      effectiveLengthM,
      status: 'INVALID_INPUT',
      warnings: ['Vacuum conductance input is invalid.'],
    };
  }

  const radius = d / 2;
  const area = Math.PI * radius ** 2;
  const volume = area * L;
  const meanPressurePa = ((p1 + p2) / 2) * 100;

  // C = pi*d^4*p_mean / (128*mu*L) for continuum laminar flow.
  const conductanceM3PerS = (Math.PI * d ** 4 * meanPressurePa) / (128 * mu * effectiveLengthM);
  const conductanceM3PerHour = conductanceM3PerS * 3600;

  if (L / d < 20) {
    warnings.push('Pipe length is below the long-pipe screening ratio; entrance/minor losses require engineering review.');
  }
  if (p1 < p2) {
    warnings.push('Upstream pressure is below downstream pressure; flow direction is not the assumed pump-down direction.');
  }
  warnings.push('Conductance is a reduced-order laminar screening value; use a regime-specific vacuum network model for final design.');

  return {
    pipeVolumeM3: volume,
    crossSectionAreaM2: area,
    meanPressurePa,
    conductanceM3PerS,
    conductanceM3PerHour,
    effectiveLengthM,
    status: 'REDUCED_ORDER_LAMINAR_SCREENING',
    warnings,
  };
}

export function combinePumpAndConductance(
  pumpCapacityM3PerHour: number,
  conductanceM3PerHour: number,
): number {
  if (!Number.isFinite(pumpCapacityM3PerHour) || pumpCapacityM3PerHour <= 0) return 0;
  if (!Number.isFinite(conductanceM3PerHour) || conductanceM3PerHour <= 0) return pumpCapacityM3PerHour;
  return 1 / (1 / pumpCapacityM3PerHour + 1 / conductanceM3PerHour);
}
