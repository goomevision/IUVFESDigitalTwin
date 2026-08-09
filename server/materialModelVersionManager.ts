export type MaterialModelRevision = {
  revisionId: string;
  materialId: string;
  parentRevisionId?: string;
  createdAt: string;
  propertyEvidenceIds: string[];
  compositionEvidenceIds: string[];
  status: "DRAFT" | "VALIDATED" | "RETIRED";
};

export type RevisionComparison = {
  materialId: string;
  fromRevisionId: string;
  toRevisionId: string;
  changedPropertyEvidenceIds: string[];
  changedCompositionEvidenceIds: string[];
  reason: string;
};

export function createMaterialModelRevision(
  revision: MaterialModelRevision,
  existing: MaterialModelRevision[],
): MaterialModelRevision {
  if (existing.some((item) => item.revisionId === revision.revisionId)) {
    throw new Error(`Revision already exists: ${revision.revisionId}`);
  }
  if (revision.parentRevisionId && !existing.some((item) => item.revisionId === revision.parentRevisionId)) {
    throw new Error(`Parent revision not found: ${revision.parentRevisionId}`);
  }
  return { ...revision, propertyEvidenceIds: [...revision.propertyEvidenceIds], compositionEvidenceIds: [...revision.compositionEvidenceIds] };
}

export function compareMaterialModelRevisions(
  from: MaterialModelRevision,
  to: MaterialModelRevision,
  reason: string,
): RevisionComparison {
  if (from.materialId !== to.materialId) throw new Error("Cannot compare revisions from different materials.");
  const changedPropertyEvidenceIds = to.propertyEvidenceIds.filter((id) => !from.propertyEvidenceIds.includes(id));
  const changedCompositionEvidenceIds = to.compositionEvidenceIds.filter((id) => !from.compositionEvidenceIds.includes(id));
  return {
    materialId: to.materialId,
    fromRevisionId: from.revisionId,
    toRevisionId: to.revisionId,
    changedPropertyEvidenceIds,
    changedCompositionEvidenceIds,
    reason,
  };
}
