import type { VehicleConfig } from "../types/world";

export interface VehicleTransformService {
  trigger: (
    fromStage: string,
    toStage: string,
    rules?: VehicleConfig["transformRules"],
    onProgress?: (progress: number) => void,
  ) => Promise<void>;
}

export function createVehicleTransformService(defaultRules: VehicleConfig["transformRules"]): VehicleTransformService {
  return {
    trigger: async (_fromStage, _toStage, rules = defaultRules, onProgress) => {
      await new Promise<void>((resolve) => {
        const start = performance.now();

        const tick = (now: number): void => {
          const progress = Math.min(1, (now - start) / rules.durationMs);
          onProgress?.(progress);
          if (progress >= 1) {
            resolve();
            return;
          }

          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      });
    },
  };
}
