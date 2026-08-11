/**
 * Experimental / hypothesis-driven ultrasonic frequency-selective model.
 *
 * IMPORTANT SCIENTIFIC BOUNDARY:
 * - This is NOT a validated molecular fingerprint model.
 * - f0, bandwidth and bondEnergy are calibration parameters, not measured
 *   properties of arbitrary materials.
 * - The four default targets are process hypotheses and MUST be replaced or
 *   calibrated with material-specific laboratory data before scientific claims.
 * - The model is intentionally isolated from the production closed-loop path
 *   until a validation dataset and acceptance criteria exist.
 */

export interface ResonanceFraction {
  key: string;
  label: string;
  f0KHz: number;
  bandwidthKHz: number;
  bondEnergyJPerKg: number;
  hypothesis: string;
}

export interface ResonanceSelectorConfig {
  fractions: ResonanceFraction[];
  pOptMbar: number;
  vaporPressureMbar: number;
}

export interface ResonanceSelectionResult {
  frequencyKHz: number;
  pressureMbar: number;
  vacuumEfficiencyRaw: number;
  vacuumEfficiency: number;
  energyInputJ: number;
  fractions: Array<{
    key: string;
    selectivity: number;
    effectiveEnergyJ: number;
    availableMassKg: number;
    releasedMassKg: number;
  }>;
}

/** Lorentzian frequency-selectivity hypothesis. */
export function getFrequencySelectivity(
  frequencyKHz: number,
  naturalFrequencyKHz: number,
  bandwidthKHz: number,
): number {
  const bandwidth = Math.max(Number.EPSILON, Math.abs(bandwidthKHz));
  return 1 / (1 + ((frequencyKHz - naturalFrequencyKHz) / bandwidth) ** 2);
}

/**
 * Vacuum/cavitation envelope used as an experimental hypothesis.
 *
 * The supplied vapor-pressure term is required because cavitation behavior
 * depends on the actual liquid/solvent/material system. The result is capped
 * to [0, 1] for use as a dimensionless coupling factor.
 */
export function getVacuumEfficiency(
  pressureMbar: number,
  vaporPressureMbar: number,
  pOptMbar = 150,
): { raw: number; normalized: number } {
  if (pressureMbar <= 0 || vaporPressureMbar <= 0 || pOptMbar <= 0) {
    return { raw: 0, normalized: 0 };
  }

  const raw = (vaporPressureMbar / pressureMbar)
    * Math.exp(-((pressureMbar - pOptMbar) / pOptMbar) ** 2);

  return { raw, normalized: Math.max(0, Math.min(1, raw)) };
}

/**
 * Applies frequency-selective energy to independent material inventories.
 * This is a reduced-order hypothesis for experimentation, not a physical
 * conservation/validated cavitation solver.
 */
export function selectFractions(
  frequencyKHz: number,
  pressureMbar: number,
  ultrasonicPowerW: number,
  dtSeconds: number,
  availableMassKg: Record<string, number>,
  config: ResonanceSelectorConfig,
): ResonanceSelectionResult {
  const vacuum = getVacuumEfficiency(
    pressureMbar,
    config.vaporPressureMbar,
    config.pOptMbar,
  );
  const energyInputJ = Math.max(0, ultrasonicPowerW) * Math.max(0, dtSeconds) * vacuum.normalized;

  const fractions = config.fractions.map((target) => {
    const selectivity = getFrequencySelectivity(
      frequencyKHz,
      target.f0KHz,
      target.bandwidthKHz,
    );
    const effectiveEnergyJ = energyInputJ * selectivity;
    const available = Math.max(0, availableMassKg[target.key] ?? 0);
    const bondEnergy = Math.max(Number.EPSILON, target.bondEnergyJPerKg);
    const released = available * (1 - Math.exp(-effectiveEnergyJ / bondEnergy));

    return {
      key: target.key,
      selectivity,
      effectiveEnergyJ,
      availableMassKg: available,
      releasedMassKg: Math.min(available, Math.max(0, released)),
    };
  });

  return {
    frequencyKHz,
    pressureMbar,
    vacuumEfficiencyRaw: vacuum.raw,
    vacuumEfficiency: vacuum.normalized,
    energyInputJ,
    fractions,
  };
}

/**
 * Default research hypotheses supplied for the IUVFES exploration UI.
 * These are deliberately marked as hypotheses; they are not material facts.
 */
export const DEFAULT_RESEARCH_FRACTIONS: ResonanceFraction[] = [
  {
    key: 'fiber',
    label: 'Serat / struktur kasar',
    f0KHz: 22,
    bandwidthKHz: 3,
    bondEnergyJPerKg: 5000,
    hypothesis: 'Hipotesis target struktur kasar; wajib dikalibrasi.',
  },
  {
    key: 'lipid',
    label: 'Lipid / minyak',
    f0KHz: 45,
    bandwidthKHz: 5,
    bondEnergyJPerKg: 2500,
    hypothesis: 'Hipotesis target lipid; wajib dikalibrasi.',
  },
  {
    key: 'protein',
    label: 'Protein / agregat',
    f0KHz: 75,
    bandwidthKHz: 4,
    bondEnergyJPerKg: 1500,
    hypothesis: 'Hipotesis target protein; wajib dikalibrasi.',
  },
  {
    key: 'bound_water',
    label: 'Air terikat / fraksi volatil',
    f0KHz: 110,
    bandwidthKHz: 8,
    bondEnergyJPerKg: 800,
    hypothesis: 'Hipotesis target air/fraksi volatil; wajib dikalibrasi.',
  },
];
