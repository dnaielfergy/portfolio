import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";

import environmentKitSchema from "../../world/schema/environment_kit.schema.json";
import environmentManifestSchema from "../../world/schema/environment_manifest.schema.json";
import environmentRegionSchema from "../../world/schema/environment_region.schema.json";
import worldConfigSchema from "../../world/schema/world_config.schema.json";
import type {
  EdgeId,
  EnvironmentConfig,
  EnvironmentConfigSource,
  EnvironmentKit,
  EnvironmentKitModule,
  EnvironmentManifest,
  EnvironmentObject,
  EnvironmentPlacement,
  EnvironmentRegion,
  NodeId,
  NormalizedWorld,
  RenderEdge,
  RenderNode,
  SceneCoords,
  WorldConfig,
  WorldConfigSource,
  WorldEdge,
  WorldNode,
} from "../types/world";

export const DEFAULT_WORLD_CONFIG_PATH = "/world/schema/world_schema_example.json";
export const SCENE_SCALE = 2.5;

const KEY_NODE_LABELS: Record<string, { text: string; offset: SceneCoords }> = {
  san_francisco: { text: "San Francisco, CA", offset: { x: 4.2, y: 1.3, z: 1.2 } },
  palo_alto_wisk: { text: "Palo Alto", offset: { x: 3.2, y: 1.15, z: 0.35 } },
  san_diego_fictiv: { text: "San Diego, CA", offset: { x: 2.4, y: 1.05, z: -1.45 } },
  huntsville_parsons: { text: "Huntsville, AL", offset: { x: -3.6, y: 1.2, z: -0.7 } },
  georgia_tech: { text: "Atlanta, GA", offset: { x: 2.1, y: 1.0, z: -1.95 } },
  charlotte: { text: "Charlotte, NC", offset: { x: 3.5, y: 1.1, z: 0.1 } },
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateWorldConfigSchema = ajv.compile(worldConfigSchema);
const validateEnvironmentManifestSchema = ajv.compile(environmentManifestSchema);
const validateEnvironmentKitSchema = ajv.compile(environmentKitSchema);
const validateEnvironmentRegionSchema = ajv.compile(environmentRegionSchema);

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "Schema validation failed with unknown error";
  }

  return errors
    .map((error) => {
      const path = error.instancePath || "/";
      return `${path} ${error.message ?? "is invalid"}`.trim();
    })
    .join("; ");
}

function assertSchemaValid(
  isValid: boolean,
  errors: ErrorObject[] | null | undefined,
  contextLabel: string,
): void {
  if (!isValid) {
    throw new Error(`${contextLabel} schema validation failed: ${formatAjvErrors(errors)}`);
  }
}

async function fetchJson<T>(path: string, errorContext: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${errorContext}: failed to load '${path}'`);
  }

  return (await response.json()) as T;
}

function hasInlineEnvironment(environment: EnvironmentConfigSource): environment is EnvironmentConfig {
  return "buildings" in environment && "collision" in environment;
}

function resolvePlacement(
  placement: EnvironmentPlacement,
  moduleById: Map<string, EnvironmentKitModule>,
  defaults: {
    colliderFallback: boolean;
    forceNonCollider: boolean;
  },
): EnvironmentObject & { collider?: boolean } {
  const template = placement.moduleId ? moduleById.get(placement.moduleId) : undefined;
  if (placement.moduleId && !template) {
    throw new Error(`Environment placement '${placement.id}' references unknown module '${placement.moduleId}'`);
  }

  const size = placement.size ?? template?.size;
  if (!size) {
    throw new Error(`Environment placement '${placement.id}' is missing size and module template`);
  }

  const colliderDefault = defaults.forceNonCollider
    ? false
    : (template?.colliderByDefault ?? defaults.colliderFallback);
  const collider = defaults.forceNonCollider ? false : (placement.collider ?? colliderDefault);

  return {
    id: placement.id,
    position: placement.position,
    size,
    rotation: placement.rotation ?? template?.rotation,
    styleKey: placement.styleKey ?? template?.styleKey,
    collider,
  };
}

async function resolveEnvironmentFromManifest(manifestRef: string): Promise<EnvironmentConfig> {
  const manifest = await fetchJson<EnvironmentManifest>(manifestRef, "Environment manifest load error");
  assertSchemaValid(
    validateEnvironmentManifestSchema(manifest),
    validateEnvironmentManifestSchema.errors,
    "Environment manifest",
  );

  const kitPayloads = await Promise.all(
    manifest.kitRefs.map(async (kitRef) => {
      const kit = await fetchJson<EnvironmentKit>(kitRef, "Environment kit load error");
      assertSchemaValid(validateEnvironmentKitSchema(kit), validateEnvironmentKitSchema.errors, "Environment kit");
      return kit;
    }),
  );
  const regionPayloads = await Promise.all(
    manifest.regionRefs.map(async (regionRef) => {
      const region = await fetchJson<EnvironmentRegion>(regionRef, "Environment region load error");
      assertSchemaValid(
        validateEnvironmentRegionSchema(region),
        validateEnvironmentRegionSchema.errors,
        "Environment region",
      );
      return region;
    }),
  );

  const moduleById = new Map<string, EnvironmentKitModule>();
  for (const kit of kitPayloads) {
    for (const module of kit.modules) {
      if (moduleById.has(module.id)) {
        throw new Error(`Environment module '${module.id}' is defined more than once across kits`);
      }
      moduleById.set(module.id, module);
    }
  }

  const buildingIds = new Set<string>();
  const propIds = new Set<string>();
  const buildings: EnvironmentConfig["buildings"] = [];
  const props: EnvironmentConfig["props"] = [];

  for (const region of regionPayloads) {
    for (const placement of region.buildings) {
      if (buildingIds.has(placement.id) || propIds.has(placement.id)) {
        throw new Error(`Duplicate environment object id '${placement.id}' across regions`);
      }

      buildingIds.add(placement.id);
      buildings.push(
        resolvePlacement(placement, moduleById, {
          colliderFallback: true,
          forceNonCollider: false,
        }),
      );
    }

    for (const placement of region.props ?? []) {
      if (buildingIds.has(placement.id) || propIds.has(placement.id)) {
        throw new Error(`Duplicate environment object id '${placement.id}' across regions`);
      }

      propIds.add(placement.id);
      const resolved = resolvePlacement(placement, moduleById, {
        colliderFallback: false,
        forceNonCollider: true,
      });
      props.push({
        id: resolved.id,
        position: resolved.position,
        size: resolved.size,
        rotation: resolved.rotation,
        styleKey: resolved.styleKey,
      });
    }
  }

  return {
    collision: manifest.collision,
    buildings,
    props,
  };
}

async function resolveEnvironment(environment: EnvironmentConfigSource): Promise<EnvironmentConfig> {
  if (hasInlineEnvironment(environment)) {
    return environment;
  }

  return resolveEnvironmentFromManifest(environment.manifestRef);
}

export async function loadWorldConfig(path = DEFAULT_WORLD_CONFIG_PATH): Promise<WorldConfig> {
  const source = await fetchJson<WorldConfigSource>(path, "World config load error");
  assertSchemaValid(
    validateWorldConfigSchema(source),
    validateWorldConfigSchema.errors,
    "World config",
  );

  const environment = await resolveEnvironment(source.environment);

  return {
    ...source,
    environment,
  };
}

function indexNodes(nodes: WorldNode[]): Record<NodeId, WorldNode> {
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

function indexEdges(edges: WorldEdge[]): Record<EdgeId, WorldEdge> {
  return Object.fromEntries(edges.map((edge) => [edge.id, edge]));
}

function buildAdjacency(nodes: WorldNode[], edges: WorldEdge[]): Record<NodeId, NodeId[]> {
  const adjacency: Record<NodeId, NodeId[]> = Object.fromEntries(nodes.map((node) => [node.id, []]));

  for (const edge of edges) {
    adjacency[edge.from]?.push(edge.to);
  }

  return adjacency;
}

export function toSceneCoords(worldX: number, worldY: number, elevation = 0): SceneCoords {
  return {
    x: worldX * SCENE_SCALE,
    y: elevation,
    z: -worldY * SCENE_SCALE,
  };
}

function deriveNodeLabel(node: WorldNode): Pick<RenderNode, "labelText" | "labelPriority" | "labelVisibleByDefault" | "labelOffset"> {
  const keyLabel = KEY_NODE_LABELS[node.id];
  if (keyLabel) {
    return {
      labelText: keyLabel.text,
      labelPriority: "key",
      labelVisibleByDefault: true,
      labelOffset: keyLabel.offset,
    };
  }

  return {
    labelText: node.name,
    labelPriority: "normal",
    labelVisibleByDefault: false,
    labelOffset: { x: 0, y: 1.1, z: 0 },
  };
}

function normalizeNode(node: WorldNode): RenderNode {
  return {
    id: node.id,
    nodeType: node.type,
    region: node.region,
    radius: node.radius,
    scenePosition: toSceneCoords(node.coords.x, node.coords.y, 0.05),
    worldPosition: {
      x: node.coords.x,
      y: node.coords.y,
    },
    ...deriveNodeLabel(node),
  };
}

function normalizeEdge(edge: WorldEdge, nodesById: Record<NodeId, WorldNode>): RenderEdge {
  const fromNode = nodesById[edge.from];
  const toNode = nodesById[edge.to];

  if (!fromNode || !toNode) {
    throw new Error(`Cannot normalize edge '${edge.id}' because endpoints are missing`);
  }

  const points = [
    toSceneCoords(fromNode.coords.x, fromNode.coords.y, 0.1),
    ...(edge.waypoints?.map((waypoint) => toSceneCoords(waypoint.x, waypoint.y, 0.1)) ?? []),
    toSceneCoords(toNode.coords.x, toNode.coords.y, 0.1),
  ];

  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    type: edge.type,
    scenePoints: points,
    visibleWhen: edge.visibleWhen,
  };
}

export function getEdgeStrokePoints(edge: RenderEdge): [number, number, number][] {
  return edge.scenePoints.map((point) => [point.x, point.y, point.z]);
}

export function normalizeWorldConfig(config: WorldConfig): NormalizedWorld {
  const nodesById = indexNodes(config.nodes);
  const renderNodes = config.nodes.map(normalizeNode);
  const renderNodesById = Object.fromEntries(renderNodes.map((node) => [node.id, node]));
  const renderEdges = config.edges.map((edge) => normalizeEdge(edge, nodesById));

  return {
    config,
    nodesById,
    edgesById: indexEdges(config.edges),
    adjacency: buildAdjacency(config.nodes, config.edges),
    renderNodes,
    renderNodesById,
    renderEdges,
  };
}
