import { randomUUID } from "crypto";

export type ScientificRecordIdentity = {
  sourceExperimentId?: string;
  researchExperimentId: string;
  experimentId: string;
};

/**
 * A research record may be attached to an existing IUVFES experiment. The
 * original experiment id remains the provenance key; only the research table
 * primary key is namespaced. Legacy callers without a source id receive a new
 * opaque identity rather than a fabricated sample or experiment reference.
 */
export function resolveScientificRecordIdentity(
  sourceExperimentId?: string,
  idFactory: () => string = randomUUID,
): ScientificRecordIdentity {
  const normalizedSource = sourceExperimentId?.trim() || undefined;
  const experimentId = normalizedSource ?? idFactory();
  return {
    sourceExperimentId: normalizedSource,
    experimentId,
    researchExperimentId: `IUVFES-EXP-${experimentId}`,
  };
}
