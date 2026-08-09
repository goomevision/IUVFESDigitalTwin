/**
 * Explicit physics profile boundary for the closed-loop coordinator.
 *
 * This is intentionally configuration-only: it does not invent material
 * properties. Values must be supplied by the caller or by an evidence-backed
 * profile. Keeping the profile separate prevents hidden constants from being
 * embedded in orchestration code.
 */
import type { DynamicMachineConfig } from './machineDynamics';

export interface ClosedLoopPhysicsProfile {
  hardware: DynamicMachineConfig;
  source?: string;
  sourceUrl?: string;
  validationStatus?: 'SIMULATION_BASELINE' | 'LITERATURE' | 'EXPERIMENTAL' | 'ENGINEERING_REVIEW';
}

export function createClosedLoopPhysicsProfile(
  hardware: DynamicMachineConfig,
  metadata: Omit<ClosedLoopPhysicsProfile, 'hardware'> = {},
): ClosedLoopPhysicsProfile {
  return {
    hardware: { ...hardware },
    ...metadata,
  };
}
