import type { IuvfesHardwareSpecification } from './hardwareSpecification';
import { deriveCylindricalChamber, validateCylindricalChamberGeometry } from './virtualHardwareGeometry';
import type { VirtualHardwareDynamicsConfig } from './machineDynamics';

export interface HardwareEngineeringProfile {
  hardwareId: string;
  revision: string;
  geometry: {
    innerDiameterM: number;
    cylindricalLengthM: number;
    wallThicknessM: number;
  };
  materialDensityKgPerM3?: number;
  dynamics: VirtualHardwareDynamicsConfig;
  derived: ReturnType<typeof deriveCylindricalChamber>;
  validation: ReturnType<typeof validateCylindricalChamberGeometry>;
}

/**
 * Converts an engineering hardware revision into deterministic simulation inputs.
 * Structural/vacuum strength is intentionally not inferred here.
 */
export function buildHardwareEngineeringProfile(
  spec: IuvfesHardwareSpecification,
  geometry: HardwareEngineeringProfile['geometry'],
  materialDensityKgPerM3?: number,
): HardwareEngineeringProfile {
  const validation = validateCylindricalChamberGeometry(geometry);
  const derived = deriveCylindricalChamber(geometry, materialDensityKgPerM3);
  const nominalPump = spec.vacuumPump.nominalCapacity.value;
  const pumpCapacityM3h = typeof nominalPump === 'number'
    ? nominalPump
    : (nominalPump.min + nominalPump.max) / 2;
  const heating = spec.heating.power.value;
  const heatingPowerKW = typeof heating === 'number'
    ? heating
    : (heating.min + heating.max) / 2;

  return {
    hardwareId: spec.systemId,
    revision: spec.version,
    geometry,
    materialDensityKgPerM3,
    dynamics: {
      chamberVolumeL: derived.internalVolumeL,
      pumpCapacityM3h,
      heatingPowerKW,
    },
    derived,
    validation,
  };
}
