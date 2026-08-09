import { describe, expect, it } from "vitest";
import { advancePhysicalDynamics } from "./physicalDynamicsEngine";

describe("physical dynamics engine", () => {
  const base = {
    temperatureK: 283.15,
    pressurePaAbs: 500,
    massKg: 10,
    heaterPowerW: 100,
    vessel: { heatTransferWPerK: 2, ambientTemperatureK: 283.15 },
    material: {
      heatCapacityJPerKgK: 4000,
      latentHeatJPerKg: 2_000_000,
      vaporPressurePaAtTemperature: (_temperatureK: number) => 1200,
    },
    vaporConductanceKgPerPaS: 0.000001,
  };

  it("changes temperature and mass progressively with elapsed time", () => {
    const oneSecond = advancePhysicalDynamics(base, 1);
    const tenSeconds = advancePhysicalDynamics(base, 10);
    expect(oneSecond.temperatureK).not.toBe(base.temperatureK);
    expect(tenSeconds.massKg).toBeLessThanOrEqual(oneSecond.massKg);
    expect(tenSeconds.evaporatedMassKg).toBeGreaterThan(oneSecond.evaporatedMassKg);
  });

  it("cannot evaporate more material than is present", () => {
    const result = advancePhysicalDynamics({ ...base, massKg: 0.000001, vaporConductanceKgPerPaS: 1 }, 10);
    expect(result.massKg).toBe(0);
    expect(result.evaporatedMassKg).toBe(0.000001);
  });
});
