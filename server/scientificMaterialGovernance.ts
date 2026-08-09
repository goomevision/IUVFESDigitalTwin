/** Governance checks for the Scientific Material Knowledge Base. */
import type { MaterialRecord, ScientificSource } from './scientificMaterialKnowledge';

export interface MaterialGovernanceIssue {
  materialId: string;
  evidenceId: string;
  code:
    | 'MISSING_SOURCE'
    | 'NUMERIC_VALUE_WITHOUT_CONDITION'
    | 'DATA_GAP_HAS_VALUE'
    | 'STANDARD_WITHOUT_GRADE_A'
    | 'UNCERTAINTY_WITHOUT_VALUE';
  message: string;
}

export function validateMaterialEvidence(
  materials: readonly MaterialRecord[],
  sources: readonly ScientificSource[],
): MaterialGovernanceIssue[] {
  const sourceMap = new Map(sources.map((source) => [source.sourceId, source]));
  const issues: MaterialGovernanceIssue[] = [];

  for (const material of materials) {
    for (const evidence of material.properties) {
      const source = evidence.sourceId ? sourceMap.get(evidence.sourceId) : undefined;
      if (!source) {
        issues.push({
          materialId: material.materialId,
          evidenceId: evidence.evidenceId,
          code: 'MISSING_SOURCE',
          message: evidence.sourceId
            ? `Evidence ${evidence.evidenceId} references unknown source ${evidence.sourceId}.`
            : `Evidence ${evidence.evidenceId} does not reference a source.`,
        });
      }

      if (evidence.value !== undefined && evidence.temperatureC === undefined && evidence.pressureKPa === undefined && evidence.property !== 'composition') {
        issues.push({
          materialId: material.materialId,
          evidenceId: evidence.evidenceId,
          code: 'NUMERIC_VALUE_WITHOUT_CONDITION',
          message: 'Numeric material properties should retain applicable temperature/pressure conditions when the source provides them.',
        });
      }

      if (evidence.validationStatus === 'DATA_GAP' && (evidence.value !== undefined || evidence.min !== undefined || evidence.max !== undefined)) {
        issues.push({
          materialId: material.materialId,
          evidenceId: evidence.evidenceId,
          code: 'DATA_GAP_HAS_VALUE',
          message: 'DATA_GAP entries must not contain inferred numeric values.',
        });
      }

      if (evidence.validationStatus === 'STANDARD' && source && source.evidenceGrade !== 'A') {
        issues.push({
          materialId: material.materialId,
          evidenceId: evidence.evidenceId,
          code: 'STANDARD_WITHOUT_GRADE_A',
          message: 'STANDARD evidence requires an authoritative grade A source.',
        });
      }

      if (evidence.uncertainty !== undefined && evidence.value === undefined) {
        issues.push({
          materialId: material.materialId,
          evidenceId: evidence.evidenceId,
          code: 'UNCERTAINTY_WITHOUT_VALUE',
          message: 'Uncertainty must be attached to a numeric value or a separately represented uncertainty model.',
        });
      }
    }
  }

  return issues;
}

export function assertMaterialKnowledgeBaseGovernance(
  materials: readonly MaterialRecord[],
  sources: readonly ScientificSource[],
): void {
  const issues = validateMaterialEvidence(materials, sources);
  if (issues.length > 0) {
    throw new Error(`Scientific Material Knowledge Base governance failed: ${issues.map((issue) => issue.message).join(' ')}`);
  }
}
