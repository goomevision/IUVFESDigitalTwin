import { describe, expect, it } from "vitest";
import { selectIF97Region } from "./if97RegionSelector";

describe("IF97 region selector", () => {
  it("routes a liquid-side state to Region 1", () => {
    const result = selectIF97Region({ temperatureK: 373.15, pressureMPa: 0.2, saturationPressureMPa: 0.101418 });
    expect(result.region).toBe(1);
    expect(result.status).toBe("SUPPORTED_REGION");
  });

  it("routes a vapor-side state to Region 2", () => {
    const result = selectIF97Region({ temperatureK: 373.15, pressureMPa: 0.05, saturationPressureMPa: 0.101418 });
    expect(result.region).toBe(2);
    expect(result.status).toBe("SUPPORTED_REGION");
  });

  it("identifies the saturation boundary as Region 4", () => {
    const result = selectIF97Region({ temperatureK: 373.15, pressureMPa: 0.101418, saturationPressureMPa: 0.101418 });
    expect(result.region).toBe(4);
    expect(result.status).toBe("SATURATION_BOUNDARY");
  });

  it("requires B23 above 623.15 K", () => {
    const result = selectIF97Region({ temperatureK: 700, pressureMPa: 20, saturationPressureMPa: 3 });
    expect(result.status).toBe("DATA_GAP");
    expect(result.region).toBeNull();
  });

  it("routes a state above B23 toward Region 3 without claiming properties", () => {
    const result = selectIF97Region({ temperatureK: 700, pressureMPa: 30, saturationPressureMPa: 3, b23PressureMPa: 20 });
    expect(result.region).toBe(3);
    expect(result.status).toBe("SUPPORTED_REGION");
  });

  it("rejects states outside the ordinary IF97 domain", () => {
    const result = selectIF97Region({ temperatureK: 1200, pressureMPa: 20, saturationPressureMPa: 1 });
    expect(result.status).toBe("OUT_OF_DOMAIN");
    expect(result.region).toBeNull();
  });
});
