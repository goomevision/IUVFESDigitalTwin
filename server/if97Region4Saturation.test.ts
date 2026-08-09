import { describe, expect, it } from "vitest";
import { saturationPressureIF97 } from "./if97Region4Saturation";

describe("IAPWS-IF97 Region 4 saturation pressure", () => {
  it("matches the normal boiling-point reference", () => {
    const result = saturationPressureIF97(373.15);
    expect(result.status).toBe("SUPPORTED");
    expect(result.pressureMPa).toBeCloseTo(0.101325, 5);
  });

  it("matches the critical point reference", () => {
    const result = saturationPressureIF97(647.096);
    expect(result.status).toBe("SUPPORTED");
    expect(result.pressureMPa).toBeCloseTo(22.064, 3);
  });

  it("rejects temperatures outside the Region 4 domain", () => {
    expect(saturationPressureIF97(250).status).toBe("OUT_OF_DOMAIN");
    expect(saturationPressureIF97(700).status).toBe("OUT_OF_DOMAIN");
  });
});
