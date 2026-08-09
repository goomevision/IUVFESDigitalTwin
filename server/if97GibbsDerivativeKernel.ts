export type GibbsCoefficient = {
  n: number;
  I: number;
  J: number;
};

export type GibbsEvaluation = {
  gamma: number;
  gammaPi: number;
  gammaTau: number;
  gammaPiPi: number;
  gammaTauTau: number;
  gammaPiTau: number;
};

export type GibbsPropertyState = {
  specificVolumeM3PerKg: number;
  enthalpyJPerKg: number;
  entropyJPerKgK: number;
  internalEnergyJPerKg: number;
  cpJPerKgK: number;
};

/**
 * Generic evaluator for the dimensionless Gibbs formulation used by IF97
 * Regions 1 and 2. Coefficients are supplied by the region-specific tables.
 *
 * This module deliberately contains no guessed coefficient tables. The official
 * IAPWS coefficients must be loaded by a region adapter and verified against
 * IAPWS reference states before the resulting properties are promoted to
 * operational simulation inputs.
 */
export function evaluateDimensionlessGibbs(
  pi: number,
  tau: number,
  coefficients: readonly GibbsCoefficient[],
): GibbsEvaluation {
  if (!Number.isFinite(pi) || !Number.isFinite(tau) || pi <= 0 || tau <= 0) {
    throw new Error("IF97 Gibbs inputs must be finite and positive");
  }

  let gamma = 0;
  let gammaPi = 0;
  let gammaTau = 0;
  let gammaPiPi = 0;
  let gammaTauTau = 0;
  let gammaPiTau = 0;

  for (const term of coefficients) {
    const p = Math.pow(pi, term.I);
    const t = Math.pow(tau, term.J);
    const base = term.n * p * t;
    gamma += base;

    if (term.I !== 0) gammaPi += term.n * term.I * Math.pow(pi, term.I - 1) * t;
    if (term.J !== 0) gammaTau += term.n * term.J * p * Math.pow(tau, term.J - 1);
    if (term.I > 1) gammaPiPi += term.n * term.I * (term.I - 1) * Math.pow(pi, term.I - 2) * t;
    if (term.J > 1) gammaTauTau += term.n * term.J * (term.J - 1) * p * Math.pow(tau, term.J - 2);
    if (term.I !== 0 && term.J !== 0) {
      gammaPiTau += term.n * term.I * term.J * Math.pow(pi, term.I - 1) * Math.pow(tau, term.J - 1);
    }
  }

  return { gamma, gammaPi, gammaTau, gammaPiPi, gammaTauTau, gammaPiTau };
}

/**
 * Converts the Gibbs derivatives into core thermodynamic properties.
 *
 * For a region using g = R*T*gamma with pi = p/p* and tau = T*/T:
 *
 * v  = R*T/p* * gammaPi
 * h  = R*T * tau*gammaTau
 * s  = R * (tau*gammaTau - gamma)
 * u  = R*T * (tau*gammaTau - pi*gammaPi)
 * cp = -R*tau^2*gammaTauTau
 */
export function gibbsProperties(
  evaluation: GibbsEvaluation,
  temperatureK: number,
  pressureScaleMPa: number,
  gasConstantJPerKgK: number,
  pressureMPa: number,
  temperatureScaleK: number,
): GibbsPropertyState {
  if (temperatureK <= 0 || pressureScaleMPa <= 0 || pressureMPa <= 0 || temperatureScaleK <= 0) {
    throw new Error("IF97 Gibbs property scales and state must be positive");
  }

  const pi = pressureMPa / pressureScaleMPa;
  const tau = temperatureScaleK / temperatureK;
  const v = gasConstantJPerKgK * temperatureK / pressureScaleMPa / 1_000_000 * evaluation.gammaPi;
  const h = gasConstantJPerKgK * temperatureK * tau * evaluation.gammaTau;
  const s = gasConstantJPerKgK * (tau * evaluation.gammaTau - evaluation.gamma);
  const u = gasConstantJPerKgK * temperatureK * (tau * evaluation.gammaTau - pi * evaluation.gammaPi);
  const cp = -gasConstantJPerKgK * tau * tau * evaluation.gammaTauTau;

  return {
    specificVolumeM3PerKg: v,
    enthalpyJPerKg: h,
    entropyJPerKgK: s,
    internalEnergyJPerKg: u,
    cpJPerKgK: cp,
  };
}
