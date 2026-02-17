import type { VehicleConfig } from "../types/world";

export interface VehicleTransformService {
  trigger: (fromStage: string, toStage: string, rules?: VehicleConfig["transformRules"]) => Promise<void>;
}

export function createVehicleTransformService(defaultRules: VehicleConfig["transformRules"]): VehicleTransformService {
  return {
    trigger: async (_fromStage, _toStage, rules = defaultRules) => {
      await new Promise((resolve) => setTimeout(resolve, rules.durationMs));
    },
  };
}
