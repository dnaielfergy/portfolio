import type { WorldState } from "../types/world";

export interface CameraProfile {
  zoomDeltaPercent: number;
  freezeFollow: boolean;
  dofBoost: number;
}

export const CAMERA_PROFILES: Record<WorldState, CameraProfile> = {
  intro: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.2 },
  idleMap: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0 },
  tutorial: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0 },
  focusCharlotte: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0 },
  exploring: { zoomDeltaPercent: 0, freezeFollow: false, dofBoost: 0 },
  checkpointOpen: { zoomDeltaPercent: 6, freezeFollow: true, dofBoost: 0.3 },
  transforming: { zoomDeltaPercent: 3, freezeFollow: true, dofBoost: 0.1 },
  finalState: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.25 },
};
