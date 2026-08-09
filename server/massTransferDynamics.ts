export type MassTransferState = {
  liquidMassKg: number;
  vaporMassKg: number;
};

export type MassTransferParameters = {
  transferCoefficientKgPerSPa: number;
  equilibriumVaporPressureKPa: number;
  actualVaporPartialPressureKPa: number;
  maxRateKgPerS?: number;
};

export type MassTransferStep = {
  state: MassTransferState;
  rateKgPerS: number;
  drivingForceKPa: number;
};

/**
 * Reduced-order first-order mass-transfer contract. The coefficient must be
 * supplied from an explicit model or measured correlation; it is never inferred
 * by this module.
 */
export function advanceMassTransfer(
  state: MassTransferState,
  parameters: MassTransferParameters,
  dtS: number,
): MassTransferStep {
  if (dtS <= 0) throw new Error("dtS must be positive.");
  if (parameters.transferCoefficientKgPerSPa < 0) throw new Error("Transfer coefficient cannot be negative.");
  if (state.liquidMassKg < 0 || state.vaporMassKg < 0) throw new Error("Mass cannot be negative.");

  const drivingForcePa = Math.max(0, (parameters.equilibriumVaporPressureKPa - parameters.actualVaporPartialPressureKPa) * 1000);
  let rate = parameters.transferCoefficientKgPerSPa * drivingForcePa;
  if (parameters.maxRateKgPerS !== undefined) rate = Math.min(rate, parameters.maxRateKgPerS);

  const transferred = Math.min(state.liquidMassKg, rate * dtS);
  return {
    state: {
      liquidMassKg: state.liquidMassKg - transferred,
      vaporMassKg: state.vaporMassKg + transferred,
    },
    rateKgPerS: transferred / dtS,
    drivingForceKPa: drivingForcePa / 1000,
  };
}
