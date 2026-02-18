import type { WorldState } from "../types/world";

export interface CameraProfile {
  zoomDeltaPercent: number;
  freezeFollow: boolean;
  dofBoost: number;
  followLeadDistance: number;
}

export const CAMERA_PROFILES: Record<WorldState, CameraProfile> = {
  intro: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.2, followLeadDistance: 0 },
  idleMap: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.05, followLeadDistance: 0 },
  tutorial: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.08, followLeadDistance: 0 },
  focusCharlotte: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.1, followLeadDistance: 0 },
  exploring: { zoomDeltaPercent: 0, freezeFollow: false, dofBoost: 0.03, followLeadDistance: 0 },
  checkpointOpen: { zoomDeltaPercent: 6, freezeFollow: true, dofBoost: 0.35, followLeadDistance: 0 },
  transforming: { zoomDeltaPercent: 3, freezeFollow: true, dofBoost: 0.2, followLeadDistance: 0 },
  finalState: { zoomDeltaPercent: 0, freezeFollow: true, dofBoost: 0.25, followLeadDistance: 0 },
};
