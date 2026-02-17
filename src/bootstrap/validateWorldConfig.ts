import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";

import worldConfigSchema from "../../world/schema/world_config.schema.json";
import type { NodeId, WorldConfig } from "../types/world";

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
}

export function validateWorldConfig(config: unknown): asserts config is WorldConfig {
  const isSchemaValid = validateSchema(config);
  if (!isSchemaValid) {
    fail(formatAjvErrors(validateSchema.errors));
  }

  validateCrossReferences(config as WorldConfig);
}
