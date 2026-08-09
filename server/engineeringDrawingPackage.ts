export type DrawingSheet = {
  number: string;
  title: string;
  purpose: string;
};

export type EngineeringDrawingPackageInput = {
  designId: string;
  revision: string;
  simulationRunId: string;
  validationReportId: string;
  hardwareModelVersion: string;
  datasetIds: string[];
  materialIds: string[];
  unresolvedChecks: string[];
};

export type EngineeringDrawingPackage = EngineeringDrawingPackageInput & {
  status: "SIMULATION_PROPOSAL" | "ENGINEERING_REVIEW_REQUIRED";
  sheets: DrawingSheet[];
  releaseBlockers: string[];
};

export function generateEngineeringDrawingPackage(input: EngineeringDrawingPackageInput): EngineeringDrawingPackage {
  const releaseBlockers = [
    ...input.unresolvedChecks,
    "Independent engineering/code verification is required before fabrication release.",
    "Physical prototype validation is required before treating simulation predictions as validated hardware performance.",
  ];

  return {
    ...input,
    status: "ENGINEERING_REVIEW_REQUIRED",
    sheets: [
      { number: "00", title: "Cover & Design Control", purpose: "Design ID, revision, status and traceability." },
      { number: "01", title: "General Arrangement", purpose: "Overall machine arrangement and principal dimensions." },
      { number: "02", title: "Pressure Vessel", purpose: "Vessel geometry, material and design conditions." },
      { number: "03", title: "Heating System", purpose: "Heater arrangement, rating and control interfaces." },
      { number: "04", title: "Condenser", purpose: "Condensation equipment and cooling interfaces." },
      { number: "05", title: "Vacuum System", purpose: "Pump, valves, conductance and vacuum connections." },
      { number: "06", title: "Piping & Instrumentation", purpose: "Process lines, valves and measurement points." },
      { number: "07", title: "Safety System", purpose: "Relief, alarm, interlock and emergency interfaces." },
      { number: "08", title: "Bill of Materials", purpose: "Controlled component and material list." },
      { number: "09", title: "Simulation Evidence", purpose: "Simulation, datasets and validation references." },
      { number: "10", title: "Revision History", purpose: "Controlled design changes and approvals." },
    ],
    releaseBlockers,
  };
}
