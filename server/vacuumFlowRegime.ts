/**
 * Vacuum-flow regime classification for the engineering screening layer.
 *
 * The regime is selected from Knudsen number using mean free path and a
 * characteristic line diameter. This does NOT replace regime-specific
 * conductance correlations or an OEM pump curve; it prevents the simulator
 * from silently treating every vacuum pressure as the same flow regime.
 */

export type VacuumFlowRegime = 'VISCOUS' | 'TRANSITIONAL' | 'MOLECULAR';

export interface VacuumFlowRegimeInput {
  absolutePressurePa: number;
  gasTemperatureK: number;
  characteristicDiameterM: number;
  molecularDiameterM?: number;
}

export interface VacuumFlowRegimeResult {
  regime: VacuumFlowRegime;
  meanFreePathM: number;
  knudsenNumber: number;
  provenance: 'KINETIC_THEORY_SCREENING';
}

const K_B = 1.380649e-23;
const SQRT_TWO_PI = Math.sqrt(2) * Math.PI;
const DEFAULT_MOLECULAR_DIAMETER_M = 3.641e-10; // water-vapor screening value

export function classifyVacuumFlowRegime(input: VacuumFlowRegimeInput): VacuumFlowRegimeResult {
  if (input.absolutePressurePa <= 0 || input.gasTemperatureK <= 0 || input.characteristicDiameterM <= 0) {
    throw new Error('Pressure, gas temperature and characteristic diameter must be positive.');
  }
  const molecularDiameterM = input.molecularDiameterM ?? DEFAULT_MOLECULAR_DIAMETER_M;
  const meanFreePathM = K_B * input.gasTemperatureK /
    (SQRT_TWO_PI * molecularDiameterM * molecularDiameterM * input.absolutePressurePa);
  const knudsenNumber = meanFreePathM / input.characteristicDiameterM;
  const regime: VacuumFlowRegime = knudsenNumber < 0.01
    ? 'VISCOUS'
    : knudsenNumber <= 0.1
      ? 'TRANSITIONAL'
      : 'MOLECULAR';
  return { regime, meanFreePathM, knudsenNumber, provenance: 'KINETIC_THEORY_SCREENING' };
}

/**
 * Screening correction only. Detailed conductance must eventually use the
 * appropriate viscous/transitional/molecular correlation for the geometry.
 */
export function regimeConductanceScreeningFactor(regime: VacuumFlowRegime): number {
  switch (regime) {
    case 'VISCOUS': return 1;
    case 'TRANSITIONAL': return 0.65;
    case 'MOLECULAR': return 0.35;
  }
}
