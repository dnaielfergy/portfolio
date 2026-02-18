import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const anchorsPath = path.join(repoRoot, "world/calibration/map_anchors.json");
const schemaPath = path.join(repoRoot, "world/schema/world_schema_example.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function pixelToWorld(px, py, meta) {
  const mapPlaneWidth = meta.mapPlaneHeight * (meta.imageWidth / meta.imageHeight);
  const sceneX = (px / meta.imageWidth - 0.5) * mapPlaneWidth;
  const sceneZ = (py / meta.imageHeight - 0.5) * meta.mapPlaneHeight;

  return {
    x: round4(sceneX / meta.sceneScale),
    y: round4(-sceneZ / meta.sceneScale),
  };
}

function toWaypoints(points, meta) {
  return points.map(({ px, py }) => pixelToWorld(px, py, meta));
}

function main() {
  const anchors = readJson(anchorsPath);
  const world = readJson(schemaPath);

  const nodeUpdates = Object.entries(anchors.nodes).map(([nodeId, pxPoint]) => ({
    nodeId,
    coords: pixelToWorld(pxPoint.px, pxPoint.py, anchors.meta),
  }));

  const edgeUpdates = Object.entries(anchors.edges).map(([edgeId, points]) => ({
    edgeId,
    waypoints: toWaypoints(points, anchors.meta),
  }));

  if (!process.argv.includes("--write")) {
    console.log(
      JSON.stringify(
        {
          nodeUpdates,
          edgeUpdates,
        },
        null,
        2,
      ),
    );
    return;
  }

  const nodeById = Object.fromEntries(world.nodes.map((node) => [node.id, node]));
  const edgeById = Object.fromEntries(world.edges.map((edge) => [edge.id, edge]));

  for (const update of nodeUpdates) {
    if (!nodeById[update.nodeId]) {
      throw new Error(`Unknown node id '${update.nodeId}' in anchors file`);
    }
    nodeById[update.nodeId].coords = update.coords;
  }

  for (const update of edgeUpdates) {
    if (!edgeById[update.edgeId]) {
      throw new Error(`Unknown edge id '${update.edgeId}' in anchors file`);
    }
    edgeById[update.edgeId].waypoints = update.waypoints;
  }

  fs.writeFileSync(schemaPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
  console.log("Updated world/schema/world_schema_example.json from world/calibration/map_anchors.json");
}

main();
