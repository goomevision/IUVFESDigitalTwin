export type ResearchStudyInput = {
  studyId: string;
  title: string;
  researchQuestion: string;
  hypothesis: string;
  materialIds: string[];
  experimentIds: string[];
  sampleIds: string[];
  instrumentIds: string[];
  calibrationIds: string[];
  datasetIds: string[];
  simulationRunIds: string[];
  validationReportIds: string[];
  hardwareDesignIds: string[];
  modelVersions: string[];
  equationIds: string[];
  parameterSetIds: string[];
  anomalies: string[];
  failedRuns: string[];
  replicationRuns: string[];
  uncertaintySources: string[];
  limitations: string[];
};

export type ResearchStudyRecord = ResearchStudyInput & {
  status: "EVIDENCE_INCOMPLETE" | "READY_FOR_SCIENTIFIC_REVIEW";
  completeness: number;
  blockers: string[];
  outputs: {
    journalReportReady: boolean;
    engineeringEvidenceReady: boolean;
    reproducibilityPackageReady: boolean;
  };
};

const requiredCollections: Array<keyof ResearchStudyInput> = [
  "materialIds",
  "experimentIds",
  "datasetIds",
  "simulationRunIds",
  "validationReportIds",
  "modelVersions",
  "equationIds",
  "uncertaintySources",
  "limitations",
];

export function buildResearchStudyRecord(input: ResearchStudyInput): ResearchStudyRecord {
  const blockers: string[] = [];
  if (!input.studyId) blockers.push("Missing study ID.");
  for (const key of requiredCollections) {
    const value = input[key];
    if (Array.isArray(value) && value.length === 0) blockers.push(`Missing ${key}.`);
  }

  if (input.experimentIds.length > 0 && input.datasetIds.length === 0) {
    blockers.push("Experiments exist without linked datasets.");
  }
  if (input.simulationRunIds.length > 0 && input.modelVersions.length === 0) {
    blockers.push("Simulation runs exist without model versions.");
  }
  if (input.validationReportIds.length > 0 && input.simulationRunIds.length === 0) {
    blockers.push("Validation reports exist without simulation runs.");
  }

  const completeness = Math.round(
    (requiredCollections.filter((key) => Array.isArray(input[key]) && (input[key] as string[]).length > 0).length /
      requiredCollections.length) *
      100,
  );
  const ready = blockers.length === 0;

  return {
    ...input,
    status: ready ? "READY_FOR_SCIENTIFIC_REVIEW" : "EVIDENCE_INCOMPLETE",
    completeness,
    blockers,
    outputs: {
      journalReportReady: ready,
      engineeringEvidenceReady: input.hardwareDesignIds.length > 0 && input.simulationRunIds.length > 0 && input.validationReportIds.length > 0,
      reproducibilityPackageReady:
        ready && input.instrumentIds.length > 0 && input.calibrationIds.length > 0 && input.parameterSetIds.length > 0,
    },
  };
}
