import { ProcessDynamics, ProcessState, OperatorCommand } from "./physicalProcessTimeline";
import { advancePhysicalDynamics, MaterialThermalProperties, VesselThermalProperties } from "./physicalDynamicsEngine";

export type DynamicsAdapterConfig = {
  vessel: VesselThermalProperties;
  material: MaterialThermalProperties;
  vaporConductanceKgPerPaS: number;
};

export function createPhysicalDynamicsAdapter(config: DynamicsAdapterConfig): ProcessDynamics {
  return (state: ProcessState, command: OperatorCommand | undefined, dtS: number): ProcessState => {
    const result = advancePhysicalDynamics({
      temperatureK: state.temperatureC + 273.15,
      pressurePaAbs: state.pressureKPaAbs * 1000,
      massKg: state.massKg,
      heaterPowerW: Math.max(command?.heaterPowerW ?? 0, 0),
      vessel: config.vessel,
      material: config.material,
      vaporConductanceKgPerPaS: config.vaporConductanceKgPerPaS,
    }, dtS);

    return {
      temperatureC: result.temperatureK - 273.15,
      pressureKPaAbs: result.pressurePaAbs / 1000,
      massKg: result.massKg,
      energyJ: state.energyJ + (command?.heaterPowerW ?? 0) * dtS,
    };
  };
}
