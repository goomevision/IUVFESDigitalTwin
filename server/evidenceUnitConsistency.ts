export type UnitValue = { value: number; unit: string };

export function requireConsistentUnit(values: UnitValue[]): string {
  if (values.length === 0) throw new Error("No values supplied.");
  const unit = values[0].unit;
  if (!unit) throw new Error("Unit is required.");
  if (values.some((item) => item.unit !== unit)) {
    throw new Error("Mixed units require an explicit conversion step before analysis.");
  }
  if (values.some((item) => !Number.isFinite(item.value))) throw new Error("Non-finite value detected.");
  return unit;
}
