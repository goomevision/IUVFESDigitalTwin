import type { IuvfesHardwareSpecification } from './hardwareSpecification';
import { deriveCylindricalChamber, validateCylindricalChamberGeometry } from './virtualHardwareGeometry';
import type { VirtualHardwareDynamicsConfig } from './machineDynamics';

export interface HardwareEngineeringProfile {
  hardwareId: string;
  revision: string;
  geometryStatus: 'VERIFIED_GEOMETRY' | 'DATASHEET_REQUIRED';
  geometry: { innerDiameterM: number; cylindricalLengthM: number; wallThicknessM: number };
  materialDensityKgPerM3?: number;
  dynamics: VirtualHardwareDynamicsConfig;
  derived: ReturnType<typeof deriveCylindricalChamber> | null;
  validation: ReturnType<typeof validateCylindricalChamberGeometry>;
  dataGaps: string[];
  assumptions: string[];
}

function rangeMid(value: { min:number; max:number } | number): number { return typeof value === 'number' ? value : (value.min + value.max) / 2; }

/** Converts a hardware revision into deterministic simulator inputs. Unknown engineering data stays explicit. */
export function buildHardwareEngineeringProfile(spec: IuvfesHardwareSpecification, overrides?: Partial<VirtualHardwareDynamicsConfig>): HardwareEngineeringProfile {
  const g = { innerDiameterM: spec.reactor.internalDiameter.value / 1000, cylindricalLengthM: spec.reactor.shellLength.value / 1000, wallThicknessM: spec.reactor.wallThickness.value / 1000 };
  const geometry = validateCylindricalChamberGeometry(g);
  const hasGeometry = geometry.valid && spec.reactor.internalDiameter.status !== 'DATASHEET_REQUIRED' && spec.reactor.shellLength.status !== 'DATASHEET_REQUIRED' && spec.reactor.wallThickness.status !== 'DATASHEET_REQUIRED';
  const derived = hasGeometry ? deriveCylindricalChamber(g) : null;
  const gaps:string[]=[]; const assumptions:string[]=[];
  if(!hasGeometry) gaps.push('Reactor geometry is DATASHEET_REQUIRED; chamber volume remains the explicit baseline input.');
  if(spec.vacuumPump.pumpCurve.status==='DATASHEET_REQUIRED') gaps.push('Vacuum pump curve is DATASHEET_REQUIRED; nominal capacity is only a screening input.');
  if(spec.heating.heatingArea.status==='DATASHEET_REQUIRED') gaps.push('Heating jacket area is DATASHEET_REQUIRED.');
  if(spec.coldTraps.some(t=>t.overallHeatTransferCoefficient.status==='DATASHEET_REQUIRED'||t.heatTransferArea.status==='DATASHEET_REQUIRED')) gaps.push('Cold-trap U/A data is DATASHEET_REQUIRED; condensation thermal capacity is not asserted.');
  assumptions.push('Thermal mass 250 kJ/K is an explicit simulation assumption until measured/calculated.');
  assumptions.push('Cooling power 3 kW is an explicit simulation assumption until equipment data is supplied.');
  const pumpCapacityM3PerHour=rangeMid(spec.vacuumPump.nominalCapacity.value); const heatingPowerKw=rangeMid(spec.heating.power.value);
  const trapTemps=spec.coldTraps.map(t=>t.temperature.value) as [number,number,number,number];
  const config:VirtualHardwareDynamicsConfig={
    connectedVolumeL: derived?.internalVolumeL ?? spec.reactor.workingVolume.value,
    pumpCapacityM3PerHour, thermalMassKjPerK:250, heatingPowerKw, coolingPowerKw:3, leakRateMbarPerSecond:0,
    vacuumPipeDiameterMm: spec.vacuumPiping.internalDiameter.value, vacuumPipeLengthM: spec.vacuumPiping.length.value, vacuumPipeEffectiveLengthFactor: spec.vacuumPiping.effectiveLengthFactor.value, vacuumPumpOutletPressureMbar: spec.vacuumPiping.outletPressure.value,
    coldTrapTemperaturesC: trapTemps, coldTrapHeatTransferCoefficientWPerM2K: spec.coldTraps[0]?.overallHeatTransferCoefficient.value ?? 0,
    coldTrapHeatTransferAreasM2: spec.coldTraps.map(t=>t.heatTransferArea.value) as [number,number,number,number], coldTrapVolumesL: spec.coldTraps.map(t=>t.volume.value) as [number,number,number,number], coldTrapCondensateCapacityKg: spec.coldTraps.map(t=>t.condensateCapacity.value) as [number,number,number,number],
    ultrasonicFrequencyMinKHz: spec.ultrasonic.frequency.value.min, ultrasonicFrequencyMaxKHz: spec.ultrasonic.frequency.value.max, ultrasonicMaxPowerKw: spec.ultrasonic.power.value.max, ultrasonicOperatingFrequencyKHz: rangeMid(spec.ultrasonic.frequency.value), ultrasonicRequestedPowerKw: 0,
    ...overrides,
  };
  return { hardwareId:spec.systemId, revision:spec.version, geometryStatus:hasGeometry?'VERIFIED_GEOMETRY':'DATASHEET_REQUIRED', geometry:g, materialDensityKgPerM3:undefined, dynamics:config, derived, validation:geometry, dataGaps:gaps, assumptions };
}
