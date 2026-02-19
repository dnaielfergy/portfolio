import { SCENE_SCALE, toSceneCoords } from "../data/loadWorldConfig";
import type { SceneCoords } from "../types/world";

const DEFAULT_MAP_PLANE_HEIGHT = 240;
const DEFAULT_MAP_PLANE_WIDTH = 170;

export interface WorldCoords {
  x: number;
  y: number;
}

export interface MapWorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function worldToScene(worldX: number, worldY: number, elevation = 0): SceneCoords {
  return toSceneCoords(worldX, worldY, elevation);
}

export function sceneToWorld(sceneX: number, sceneZ: number): WorldCoords {
  return {
    x: sceneX / SCENE_SCALE,
    y: -sceneZ / SCENE_SCALE,
  };
}

export function roundCoord(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function buildCoordsPayload(coords: WorldCoords): string {
  const payload = {
    x: roundCoord(coords.x),
    y: roundCoord(coords.y),
  };

  return JSON.stringify(payload, null, 2);
}

interface BoundsParams {
  imageWidth?: number;
  imageHeight?: number;
  mapPlaneHeight?: number;
  fallbackPlaneWidth?: number;
  sceneScale?: number;
}

function sanitizePositive(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

export function deriveMapWorldBounds(params: BoundsParams = {}): MapWorldBounds {
  const mapPlaneHeight = sanitizePositive(params.mapPlaneHeight, DEFAULT_MAP_PLANE_HEIGHT);
  const fallbackPlaneWidth = sanitizePositive(params.fallbackPlaneWidth, DEFAULT_MAP_PLANE_WIDTH);
  const sceneScale = sanitizePositive(params.sceneScale, SCENE_SCALE);
  const imageWidth = params.imageWidth;
  const imageHeight = params.imageHeight;
  const hasImageDimensions =
    Number.isFinite(imageWidth) &&
    Number.isFinite(imageHeight) &&
    typeof imageWidth === "number" &&
    typeof imageHeight === "number" &&
    imageWidth > 0 &&
    imageHeight > 0;
  const mapPlaneWidth = hasImageDimensions ? mapPlaneHeight * (imageWidth / imageHeight) : fallbackPlaneWidth;
  const halfWorldWidth = mapPlaneWidth / sceneScale / 2;
  const halfWorldHeight = mapPlaneHeight / sceneScale / 2;

  return {
    minX: -halfWorldWidth,
    maxX: halfWorldWidth,
    minY: -halfWorldHeight,
    maxY: halfWorldHeight,
  };
}

export function clampToMapBounds(coords: WorldCoords, bounds: MapWorldBounds): WorldCoords {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, coords.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, coords.y)),
  };
}
