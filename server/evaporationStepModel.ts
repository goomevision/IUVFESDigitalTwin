export type EvaporationComponentState = {
  id: string;
  liquidMoles: number;
  equilibriumVaporFraction: number;
  molecularWeightKgPerKmol: number;
};

export type EvaporationStepResult = {
  removedVaporMoles: number;
  removedByComponent: Record<string, number>;
  nextLiquidMoles: Record<string, number>;
  warnings: string[];
};

/**
 * Applies a bounded relaxation toward an equilibrium vapor fraction.
 * The rate/transfer coefficient is deliberately an explicit input; it is not
 * inferred from equilibrium alone. This prevents a thermodynamic equilibrium
 * calculation from being mistaken for a kinetic evaporation model.
 */
export function advanceEvaporationStep(
  components: EvaporationComponentState[],
  totalLiquidMoles: number,
  dtS: number,
  massTransferFractionPerS: number,
): EvaporationStepResult {
  if (!(totalLiquidMoles >= 0) || !(dtS > 0) || !(massTransferFractionPerS >= 0)) {
    throw new Error("Invalid evaporation step inputs.");
  }
  const removedByComponent: Record<string, number> = {};
  const nextLiquidMoles: Record<string, number> = {};
  const warnings: string[] = [];
  let removedVaporMoles = 0;

  const totalAvailable = components.reduce((sum, c) => sum + c.liquidMoles, 0);
  const fraction = Math.min(1, massTransferFractionPerS * dtS);
  const expected = Math.min(totalLiquidMoles, totalAvailable * fraction);

  for (const component of components) {
    const available = Math.max(0, component.liquidMoles);
    const desired = available * Math.max(0, Math.min(1, component.equilibriumVaporFraction));
    const share = totalAvailable > 0 ? available / totalAvailable : 0;
    const removed = Math.min(available, expected * share, desired * fraction);
    removedByComponent[component.id] = removed;
    nextLiquidMoles[component.id] = available - removed;
    removedVaporMoles += removed;
  }

  if (removedVaporMoles > totalLiquidMoles + 1e-12) warnings.push("MASS_BALANCE_GUARD_TRIGGERED");
  return { removedVaporMoles: Math.min(removedVaporMoles, totalLiquidMoles), removedByComponent, nextLiquidMoles, warnings };
}
