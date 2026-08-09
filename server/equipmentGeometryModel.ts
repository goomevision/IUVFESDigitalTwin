export type VesselGeometry = {
  vesselId: string;
  internalVolumeM3: number;
  internalDiameterM?: number;
  internalHeightM?: number;
  wallMassKg: number;
  wallCpJPerKgK: number;
  insulationConductanceWPerK?: number;
  headspaceVolumeM3?: number;
  freeSurfaceAreaM2?: number;
};

export function validateVesselGeometry(geometry: VesselGeometry): void {
  if (geometry.internalVolumeM3 <= 0) throw new Error("Vessel volume must be positive.");
  if (geometry.wallMassKg < 0 || geometry.wallCpJPerKgK < 0) throw new Error("Wall thermal mass cannot be negative.");
  if (geometry.internalDiameterM !== undefined && geometry.internalDiameterM <= 0) throw new Error("Diameter must be positive.");
  if (geometry.internalHeightM !== undefined && geometry.internalHeightM <= 0) throw new Error("Height must be positive.");
  if (geometry.headspaceVolumeM3 !== undefined && geometry.headspaceVolumeM3 < 0) throw new Error("Headspace cannot be negative.");
  if (geometry.freeSurfaceAreaM2 !== undefined && geometry.freeSurfaceAreaM2 < 0) throw new Error("Free surface area cannot be negative.");
}
