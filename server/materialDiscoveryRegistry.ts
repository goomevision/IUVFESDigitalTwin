export type DiscoveryEvidenceKind = "OBSERVED" | "LITERATURE_REPORTED" | "INFERRED";
export type DiscoveryStatus = "OBSERVED" | "REVIEW_REQUIRED" | "VALIDATED" | "REJECTED";

export type MaterialDiscovery = {
  discoveryId: string;
  materialId: string;
  sampleId?: string;
  componentName: string;
  identifier?: string;
  evidenceKind: DiscoveryEvidenceKind;
  status: DiscoveryStatus;
  concentration?: { value: number; unit: string; basis?: string };
  properties: Record<string, { value: number; unit: string; provenanceId: string }>;
  method: string;
  operatingCondition?: string;
  provenanceIds: string[];
  discoveredAt: string;
  notes?: string;
};

export function registerMaterialDiscovery(discovery: MaterialDiscovery): MaterialDiscovery {
  if (!discovery.discoveryId || !discovery.materialId || !discovery.componentName || !discovery.method) {
    throw new Error("Discovery requires an ID, material, component and method.");
  }
  if (discovery.evidenceKind === "INFERRED" && discovery.status === "VALIDATED") {
    throw new Error("Inferred evidence cannot be registered as VALIDATED without explicit validation evidence.");
  }
  for (const [name, property] of Object.entries(discovery.properties)) {
    if (!Number.isFinite(property.value) || !property.unit || !property.provenanceId) {
      throw new Error(`Invalid property evidence for ${name}.`);
    }
  }
  if (discovery.concentration && (!Number.isFinite(discovery.concentration.value) || discovery.concentration.value < 0)) {
    throw new Error("Concentration must be finite and non-negative.");
  }
  return { ...discovery, provenanceIds: Array.from(new Set(discovery.provenanceIds)) };
}

export function enrichMaterialComposition(
  existing: MaterialDiscovery[],
  incoming: MaterialDiscovery,
): MaterialDiscovery[] {
  const accepted = registerMaterialDiscovery(incoming);
  const duplicate = existing.find((item) =>
    item.materialId === accepted.materialId &&
    item.componentName === accepted.componentName &&
    item.identifier === accepted.identifier &&
    item.sampleId === accepted.sampleId,
  );
  if (duplicate) {
    const mergedProvenanceIds = Array.from(new Set([...duplicate.provenanceIds, ...accepted.provenanceIds]));
    return existing.map((item) => item.discoveryId === duplicate.discoveryId
      ? { ...item, properties: { ...item.properties, ...accepted.properties }, provenanceIds: mergedProvenanceIds }
      : item);
  }
  return [...existing, accepted];
}
