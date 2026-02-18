import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";

import worldConfigSchema from "../../world/schema/world_config.schema.json";
import type { EnvironmentObject, NodeId, WorldConfig } from "../types/world";

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(worldConfigSchema);

function fail(message: string): never {
  throw new Error(`World config validation error: ${message}`);
}

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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    fail(message);
  }
}

function assertEnvironmentObject(id: string, object: EnvironmentObject): void {
  assert(object.size.width > 0, `Environment object '${id}' must have width > 0`);
  assert(object.size.depth > 0, `Environment object '${id}' must have depth > 0`);
  assert(object.size.height > 0, `Environment object '${id}' must have height > 0`);
}

function validateEnvironment(config: WorldConfig): void {
  const environment = config.environment as
    | (WorldConfig["environment"] & { manifestRef?: string })
    | { manifestRef: string; buildings?: never; props?: never; collision?: never };
  if (!("buildings" in environment) || !Array.isArray(environment.buildings)) {
    return;
  }
  const props = Array.isArray(environment.props) ? environment.props : [];

  const ids = new Set<string>();

  for (const building of environment.buildings) {
    assert(!ids.has(building.id), `Duplicate environment object id '${building.id}'`);
    ids.add(building.id);
    assertEnvironmentObject(building.id, building);
  }

  for (const prop of props) {
    assert(!ids.has(prop.id), `Duplicate environment object id '${prop.id}'`);
    ids.add(prop.id);
    assertEnvironmentObject(prop.id, prop);
  }

  const nodeXs = config.nodes.map((node) => node.coords.x);
  const nodeYs = config.nodes.map((node) => node.coords.y);
  const minX = Math.min(...nodeXs) - 12;
  const maxX = Math.max(...nodeXs) + 12;
  const minY = Math.min(...nodeYs) - 12;
  const maxY = Math.max(...nodeYs) + 12;

  for (const object of [...environment.buildings, ...props]) {
    assert(
      object.position.x >= minX && object.position.x <= maxX,
      `Environment object '${object.id}' has x '${object.position.x}' outside map sanity bounds [${minX}, ${maxX}]`,
    );
    assert(
      object.position.y >= minY && object.position.y <= maxY,
      `Environment object '${object.id}' has y '${object.position.y}' outside map sanity bounds [${minY}, ${maxY}]`,
    );
  }
}

function validateCrossReferences(config: WorldConfig): void {
  const nodeIds = new Set<NodeId>();
  for (const node of config.nodes) {
    assert(!nodeIds.has(node.id), `Duplicate node id '${node.id}'`);
    nodeIds.add(node.id);
  }

  for (const edge of config.edges) {
    assert(nodeIds.has(edge.from), `Edge '${edge.id}' references missing from-node '${edge.from}'`);
    assert(nodeIds.has(edge.to), `Edge '${edge.id}' references missing to-node '${edge.to}'`);
    if ("nodeId" in edge.visibleWhen) {
      assert(
        nodeIds.has(edge.visibleWhen.nodeId),
        `Edge '${edge.id}' visible rule references missing node '${edge.visibleWhen.nodeId}'`,
      );
    }
  }

  assert(
    config.progression.mainSequence[0] === config.progression.startNodeId,
    "progression.startNodeId must equal first mainSequence node",
  );
  assert(
    config.progression.mainSequence[config.progression.mainSequence.length - 1] ===
      config.progression.finalNodeId,
    "progression.finalNodeId must equal last mainSequence node",
  );

  for (const nodeId of config.progression.mainSequence) {
    assert(nodeIds.has(nodeId), `mainSequence references missing node '${nodeId}'`);
  }

  for (const [parent, sideQuestNodes] of Object.entries(config.progression.sideQuests)) {
    assert(nodeIds.has(parent), `sideQuests parent node '${parent}' does not exist`);
    for (const sideNode of sideQuestNodes) {
      assert(nodeIds.has(sideNode), `sideQuests entry references missing node '${sideNode}'`);
    }
  }

  const validStageIds = new Set(config.vehicles.stages.map((stage) => stage.id));
  for (const [nodeId, stageId] of Object.entries(config.vehicles.stageByNodeId)) {
    assert(nodeIds.has(nodeId), `stageByNodeId references missing node '${nodeId}'`);
    assert(validStageIds.has(stageId), `stageByNodeId references missing stage '${stageId}'`);
  }

  validateEnvironment(config);
}

export function validateWorldConfig(config: unknown): asserts config is WorldConfig {
  const isSchemaValid = validateSchema(config);
  if (!isSchemaValid) {
    fail(formatAjvErrors(validateSchema.errors));
  }

  validateCrossReferences(config as WorldConfig);
}
