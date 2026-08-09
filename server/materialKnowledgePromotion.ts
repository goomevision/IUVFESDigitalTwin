export type DiscoveryStatus = "OBSERVED" | "LITERATURE_REPORTED" | "INFERRED";
export type PropertyStatus = "UNVERIFIED" | "REVIEWED" | "VALIDATED";

export type MaterialDiscovery = {
  discoveryId: string;
  materialId: string;
  componentId: string;
  status: DiscoveryStatus;
  evidenceIds: string[];
};

export type PropertyEvidence = {
  propertyId: string;
  value: number;
  unit: string;
  sourceId: string;
  provenanceId: string;
  status: PropertyStatus;
};

export type PromotionResult = {
  promoted: boolean;
  materialId: string;
  componentId: string;
  acceptedProperties: PropertyEvidence[];
  blockers: string[];
};

/**
 * A discovery becomes simulation-eligible only when the required property
 * evidence has been explicitly reviewed/validated. Inferred observations can
 * enrich the knowledge graph but cannot silently become simulation facts.
 */
export function promoteDiscoveryToMaterialModel(
  discovery: MaterialDiscovery,
  properties: PropertyEvidence[],
  requiredPropertyIds: string[],
): PromotionResult {
  const blockers: string[] = [];

  if (discovery.status === "INFERRED") {
    blockers.push("Inferred discovery cannot be promoted directly to a simulation material model.");
  }
  if (discovery.evidenceIds.length === 0) {
    blockers.push("Discovery has no evidence identifiers.");
  }

  const acceptedProperties = properties.filter((property) => property.status === "VALIDATED");
  for (const requiredId of requiredPropertyIds) {
    if (!acceptedProperties.some((property) => property.propertyId === requiredId)) {
      blockers.push(`Required validated property missing: ${requiredId}.`);
    }
  }

  return {
    promoted: blockers.length === 0,
    materialId: discovery.materialId,
    componentId: discovery.componentId,
    acceptedProperties,
    blockers,
  };
}
