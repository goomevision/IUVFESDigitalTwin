import { describe, expect, it } from "vitest";
import { generateEngineeringDrawingPackage } from "./engineeringDrawingPackage";

describe("engineering drawing package", () => {
  it("creates controlled sheets and blocks fabrication release", () => {
    const result = generateEngineeringDrawingPackage({
      designId: "IUVFES-DESIGN-001",
      revision: "A",
      simulationRunId: "SIM-001",
      validationReportId: "VAL-001",
      hardwareModelVersion: "HW-1",
      datasetIds: ["DATA-001"],
      materialIds: ["MAT-001"],
      unresolvedChecks: ["Pressure vessel code review pending."],
    });

    expect(result.status).toBe("ENGINEERING_REVIEW_REQUIRED");
    expect(result.sheets.length).toBeGreaterThanOrEqual(10);
    expect(result.sheets.some((sheet) => sheet.title === "Pressure Vessel")).toBe(true);
    expect(result.releaseBlockers.length).toBeGreaterThan(1);
  });
});
