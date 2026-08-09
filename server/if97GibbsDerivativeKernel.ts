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

/** Evaluates gamma = sum(n*pi^I*tau^J) and its first/second derivatives. */
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
    gamma += term.n * p * t;
    if (term.I !== 0) gammaPi += term.n * term.I * Math.pow(pi, term.I - 1) * t;
    if (term.J !== 0) gammaTau += term.n * term.J * p * Math.pow(tau, term.J - 1);
    // The second derivative is also valid for I/J < 0. IF97 contains
    // negative exponents in several coefficient sets, so checking > 1
    // silently drops valid curvature terms.
    if (term.I !== 0 && term.I !== 1) gammaPiPi += term.n * term.I * (term.I - 1) * Math.pow(pi, term.I - 2) * t;
    if (term.J !== 0 && term.J !== 1) gammaTauTau += term.n * term.J * (term.J - 1) * p * Math.pow(tau, term.J - 2);
    if (term.I !== 0 && term.J !== 0) {
      gammaPiTau += term.n * term.I * term.J * Math.pow(pi, term.I - 1) * Math.pow(tau, term.J - 1);
    }
  }

  return { gamma, gammaPi, gammaTau, gammaPiPi, gammaTauTau, gammaPiTau };
}

/**
 * Evaluates a Gibbs polynomial in transformed variables x = piOffset + piSign*pi
 * and y = tauOffset + tauSign*tau. The signs propagate through derivatives.
 * This supports IF97 Region 1, whose polynomial uses x = 7.1 - pi and
 * y = tau - 1.222.
 */
export function evaluateTransformedGibbs(
  pi: number,
  tau: number,
  coefficients: readonly GibbsCoefficient[],
  piOffset: number,
  tauOffset: number,
  piSign: 1 | -1 = 1,
  tauSign: 1 | -1 = 1,
): GibbsEvaluation {
  if (!Number.isFinite(pi) || !Number.isFinite(tau) || pi <= 0 || tau <= 0) {
    throw new Error("IF97 Gibbs inputs must be finite and positive");
  }

  const x = piOffset + piSign * pi;
  const y = tauOffset + tauSign * tau;
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Invalid transformed Gibbs state");

  let gamma = 0;
  let gammaPi = 0;
  let gammaTau = 0;
  let gammaPiPi = 0;
  let gammaTauTau = 0;
  let gammaPiTau = 0;

  for (const term of coefficients) {
    const xp = Math.pow(x, term.I);
    const yj = Math.pow(y, term.J);
    gamma += term.n * xp * yj;
    if (term.I !== 0) gammaPi += piSign * term.n * term.I * Math.pow(x, term.I - 1) * yj;
    if (term.J !== 0) gammaTau += tauSign * term.n * term.J * xp * Math.pow(y, term.J - 1);
    if (term.I !== 0 && term.I !== 1) gammaPiPi += term.n * term.I * (term.I - 1) * Math.pow(x, term.I - 2) * yj;
    if (term.J !== 0 && term.J !== 1) gammaTauTau += term.n * term.J * (term.J - 1) * xp * Math.pow(y, term.J - 2);
    if (term.I !== 0 && term.J !== 0) {
      gammaPiTau += piSign * tauSign * term.n * term.I * term.J * Math.pow(x, term.I - 1) * Math.pow(y, term.J - 1);
    }
  }

  return { gamma, gammaPi, gammaTau, gammaPiPi, gammaTauTau, gammaPiTau };
}

/** Converts Gibbs derivatives into core thermodynamic properties. */
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
  const v = gasConstantJPerKgK * temperatureK / (pressureScaleMPa * 1_000_000) * evaluation.gammaPi;
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
