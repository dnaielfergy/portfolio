import type { EnvironmentConfig, TransformState, VehicleConfig } from "../types/world";

export interface VehicleColliderWorldConfig {
  vehicles: Pick<VehicleConfig, "stages">;
  environment: Pick<EnvironmentConfig, "collision">;
}

export interface ResolveActivePlayerRadiusParams {
  worldConfig: VehicleColliderWorldConfig;
  activeVehicleStageId: string;
  transform: TransformState;
}

function resolveStageRadius(stageId: string, worldConfig: VehicleColliderWorldConfig): number | null {
  const stage = worldConfig.vehicles.stages.find((candidate) => candidate.id === stageId);
  const stageCollider = stage?.collider;
  if (!stageCollider || stageCollider.shape !== "circle") {
    return null;
  }

  return stageCollider.radius;
}

export function resolveActivePlayerRadius(params: ResolveActivePlayerRadiusParams): number {
  const {
    worldConfig,
    activeVehicleStageId,
    transform,
  } = params;
  const fallbackRadius = worldConfig.environment.collision.playerRadius;

  if (transform.status === "running") {
    const fromRadius = resolveStageRadius(transform.fromStage, worldConfig) ?? fallbackRadius;
    const toRadius = resolveStageRadius(transform.toStage, worldConfig) ?? fallbackRadius;
    return Math.max(fromRadius, toRadius);
  }

  return resolveStageRadius(activeVehicleStageId, worldConfig) ?? fallbackRadius;
}
