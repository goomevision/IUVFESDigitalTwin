import { IUVFES_VMMES_BASELINE } from './hardwareSpecification';
import { buildHardwareEngineeringProfile, type HardwareEngineeringProfile } from './hardwareEngineering';

export const REGISTERED_HARDWARE_PROFILES: Record<string, HardwareEngineeringProfile> = {
  [IUVFES_VMMES_BASELINE.systemId]: buildHardwareEngineeringProfile(IUVFES_VMMES_BASELINE),
};

export function getHardwareEngineeringProfile(hardwareProfileId?: string): HardwareEngineeringProfile {
  const id = hardwareProfileId ?? IUVFES_VMMES_BASELINE.systemId;
  const profile = REGISTERED_HARDWARE_PROFILES[id];
  if (!profile) throw new Error(`Unknown hardware profile: ${id}`);
  return profile;
}
