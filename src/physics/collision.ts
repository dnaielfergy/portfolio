import type { EnvironmentCollisionConfig, EnvironmentConfig } from "../types/world";

interface Vec2 {
  x: number;
  y: number;
}

interface FootprintCollider {
  id: string;
  center: Vec2;
  halfSize: Vec2;
  rotationRad: number;
}

export interface CollisionIndex {
  colliders: FootprintCollider[];
  grid: Map<string, number[]>;
  cellSize: number;
}

export interface MovementResolutionResult {
  position: Vec2;
  collided: boolean;
}

const EPSILON = 1e-6;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rotate(point: Vec2, radians: number): Vec2 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

function toLocal(point: Vec2, collider: FootprintCollider): Vec2 {
  const translated = {
    x: point.x - collider.center.x,
    y: point.y - collider.center.y,
  };
  return rotate(translated, -collider.rotationRad);
}

function toWorldDirection(localDirection: Vec2, collider: FootprintCollider): Vec2 {
  return rotate(localDirection, collider.rotationRad);
}

function hashCell(x: number, y: number): string {
  return `${x}:${y}`;
}

function getColliderAabb(collider: FootprintCollider, padding = 0): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const cos = Math.cos(collider.rotationRad);
  const sin = Math.sin(collider.rotationRad);
  const extentX = Math.abs(cos) * collider.halfSize.x + Math.abs(sin) * collider.halfSize.y;
  const extentY = Math.abs(sin) * collider.halfSize.x + Math.abs(cos) * collider.halfSize.y;

  return {
    minX: collider.center.x - extentX - padding,
    maxX: collider.center.x + extentX + padding,
    minY: collider.center.y - extentY - padding,
    maxY: collider.center.y + extentY + padding,
  };
}

function queryNearbyColliders(index: CollisionIndex, position: Vec2, radius: number): FootprintCollider[] {
  const minCellX = Math.floor((position.x - radius) / index.cellSize);
  const maxCellX = Math.floor((position.x + radius) / index.cellSize);
  const minCellY = Math.floor((position.y - radius) / index.cellSize);
  const maxCellY = Math.floor((position.y + radius) / index.cellSize);

  const seen = new Set<number>();
  const nearby: FootprintCollider[] = [];

  for (let x = minCellX; x <= maxCellX; x += 1) {
    for (let y = minCellY; y <= maxCellY; y += 1) {
      const candidates = index.grid.get(hashCell(x, y));
      if (!candidates) {
        continue;
      }

      for (const colliderIndex of candidates) {
        if (seen.has(colliderIndex)) {
          continue;
        }
        seen.add(colliderIndex);
        const collider = index.colliders[colliderIndex];
        if (collider) {
          nearby.push(collider);
        }
      }
    }
  }

  return nearby;
}

function computePenetration(position: Vec2, radius: number, collider: FootprintCollider): Vec2 | null {
  const localCenter = toLocal(position, collider);
  const clampedPoint = {
    x: clamp(localCenter.x, -collider.halfSize.x, collider.halfSize.x),
    y: clamp(localCenter.y, -collider.halfSize.y, collider.halfSize.y),
  };

  const deltaLocal = {
    x: localCenter.x - clampedPoint.x,
    y: localCenter.y - clampedPoint.y,
  };
  const distanceSquared = deltaLocal.x * deltaLocal.x + deltaLocal.y * deltaLocal.y;

  if (distanceSquared >= radius * radius) {
    return null;
  }

  let normalLocal: Vec2;
  let penetration = 0;

  if (distanceSquared > EPSILON) {
    const distance = Math.sqrt(distanceSquared);
    normalLocal = {
      x: deltaLocal.x / distance,
      y: deltaLocal.y / distance,
    };
    penetration = radius - distance;
  } else {
    const xDepth = collider.halfSize.x - Math.abs(localCenter.x);
    const yDepth = collider.halfSize.y - Math.abs(localCenter.y);

    if (xDepth < yDepth) {
      normalLocal = {
        x: localCenter.x >= 0 ? 1 : -1,
        y: 0,
      };
      penetration = xDepth + radius;
    } else {
      normalLocal = {
        x: 0,
        y: localCenter.y >= 0 ? 1 : -1,
      };
      penetration = yDepth + radius;
    }
  }

  const normalWorld = toWorldDirection(normalLocal, collider);
  return {
    x: normalWorld.x * (penetration + EPSILON),
    y: normalWorld.y * (penetration + EPSILON),
  };
}

function resolveCircleAtPosition(
  index: CollisionIndex,
  targetPosition: Vec2,
  radius: number,
  maxSlideIterations: number,
): MovementResolutionResult {
  let position = targetPosition;
  let collided = false;

  for (let iteration = 0; iteration < maxSlideIterations; iteration += 1) {
    const nearby = queryNearbyColliders(index, position, radius);
    let corrected = false;

    for (const collider of nearby) {
      const correction = computePenetration(position, radius, collider);
      if (!correction) {
        continue;
      }

      position = {
        x: position.x + correction.x,
        y: position.y + correction.y,
      };
      corrected = true;
      collided = true;
    }

    if (!corrected) {
      break;
    }
  }

  return { position, collided };
}

export function buildCollisionIndex(environment: EnvironmentConfig): CollisionIndex {
  const colliders: FootprintCollider[] = environment.buildings
    .filter((building) => building.collider !== false)
    .map((building) => ({
      id: building.id,
      center: {
        x: building.position.x,
        y: building.position.y,
      },
      halfSize: {
        x: building.size.width / 2,
        y: building.size.depth / 2,
      },
      rotationRad: ((building.rotation ?? 0) * Math.PI) / 180,
    }));

  const largestFootprint = colliders.reduce(
    (maxSize, collider) => Math.max(maxSize, collider.halfSize.x * 2, collider.halfSize.y * 2),
    0,
  );
  const cellSize = Math.max(2, largestFootprint + environment.collision.playerRadius * 2);
  const grid = new Map<string, number[]>();

  colliders.forEach((collider, colliderIndex) => {
    const aabb = getColliderAabb(collider);
    const minCellX = Math.floor(aabb.minX / cellSize);
    const maxCellX = Math.floor(aabb.maxX / cellSize);
    const minCellY = Math.floor(aabb.minY / cellSize);
    const maxCellY = Math.floor(aabb.maxY / cellSize);

    for (let x = minCellX; x <= maxCellX; x += 1) {
      for (let y = minCellY; y <= maxCellY; y += 1) {
        const key = hashCell(x, y);
        const existing = grid.get(key);
        if (existing) {
          existing.push(colliderIndex);
        } else {
          grid.set(key, [colliderIndex]);
        }
      }
    }
  });

  return {
    colliders,
    grid,
    cellSize,
  };
}

export function resolveMovementWithCollisions(params: {
  index: CollisionIndex;
  position: Vec2;
  velocity: Vec2;
  deltaSeconds: number;
  collision: EnvironmentCollisionConfig;
}): MovementResolutionResult {
  const {
    index,
    position,
    velocity,
    deltaSeconds,
    collision,
  } = params;

  if (!collision.enabled || deltaSeconds <= 0 || index.colliders.length === 0) {
    return {
      position: {
        x: position.x + velocity.x * deltaSeconds,
        y: position.y + velocity.y * deltaSeconds,
      },
      collided: false,
    };
  }

  const intendedMove = {
    x: velocity.x * deltaSeconds,
    y: velocity.y * deltaSeconds,
  };
  const moveDistance = Math.hypot(intendedMove.x, intendedMove.y);
  const stepDistance = Math.max(collision.playerRadius * 0.55, 0.3);
  const steps = Math.max(1, Math.ceil(moveDistance / stepDistance));
  const step = {
    x: intendedMove.x / steps,
    y: intendedMove.y / steps,
  };

  let nextPosition = position;
  let collided = false;

  for (let stepIndex = 0; stepIndex < steps; stepIndex += 1) {
    const attempt = {
      x: nextPosition.x + step.x,
      y: nextPosition.y + step.y,
    };

    const resolved = resolveCircleAtPosition(
      index,
      attempt,
      collision.playerRadius,
      collision.maxSlideIterations,
    );
    nextPosition = resolved.position;
    collided = collided || resolved.collided;
  }

  return {
    position: nextPosition,
    collided,
  };
}

