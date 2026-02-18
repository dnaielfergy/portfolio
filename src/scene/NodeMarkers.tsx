import { Html } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { isInsideNodeRadius, isNodeOpenableNow } from "../input/proximityDetector";
import { useWorldStoreContext } from "../state/worldStore";

const LOCKED_COLOR = new THREE.Color("#4b5665");
const AVAILABLE_COLOR = new THREE.Color("#c9a227");

export function NodeMarkers(): React.JSX.Element {
  const {
    world,
    state,
    dispatch,
  } = useWorldStoreContext();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const nodeColorById = useMemo(() => {
    const completedColor = new THREE.Color(world.config.style.nodeMarkerStyle.completedColor);

    return Object.fromEntries(
      world.renderNodes.map((node) => {
        if (state.progression.completedNodeIds.has(node.id)) {
          return [node.id, completedColor];
        }

        if (state.progression.availableNodeIds.has(node.id)) {
          const palette = world.config.style.regionPalettes[node.region];
          return [node.id, palette ? new THREE.Color(palette.accent) : AVAILABLE_COLOR];
        }

        return [node.id, LOCKED_COLOR];
      }),
    );
  }, [state.progression.availableNodeIds, state.progression.completedNodeIds, world.config.style.nodeMarkerStyle.completedColor, world.config.style.regionPalettes, world.renderNodes]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const dummy = new THREE.Object3D();

    world.renderNodes.forEach((node, index) => {
      dummy.position.set(node.scenePosition.x, node.scenePosition.y, node.scenePosition.z);
      const worldNode = world.nodesById[node.id];
      const isAvailable = state.progression.availableNodeIds.has(node.id);
      const canOpenNodeNow = isNodeOpenableNow({
        worldState: state.worldState,
        isAvailable,
        player: state.player.position,
        node: worldNode,
      });
      const isHovered = state.hoveredNodeId === node.id && canOpenNodeNow;
      const scale = canOpenNodeNow ? (isHovered ? 1.22 : 1.2) : 1;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);

      const color = (nodeColorById[node.id] ?? LOCKED_COLOR).clone();
      if (isHovered) {
        color.lerp(new THREE.Color("#ffe6a6"), 0.35);
      }
      mesh.setColorAt(index, color);
    });

    mesh.instanceColor!.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [
    nodeColorById,
    state.hoveredNodeId,
    state.player.position,
    state.progression.availableNodeIds,
    state.worldState,
    world.nodesById,
    world.renderNodes,
  ]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, world.renderNodes.length]}
        castShadow
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.65, 0.65, 0.22, 24]} />
        <meshStandardMaterial roughness={1} metalness={0} vertexColors />
      </instancedMesh>

      {world.renderNodes.map((node) => {
        const worldNode = world.nodesById[node.id];
        const isAvailable = state.progression.availableNodeIds.has(node.id);
        const canOpenNodeNow = isNodeOpenableNow({
          worldState: state.worldState,
          isAvailable,
          player: state.player.position,
          node: worldNode,
        });
        const isHovered = state.hoveredNodeId === node.id && canOpenNodeNow;
        const showPersistentLabel = !!node.labelVisibleByDefault && !!node.labelText;
        const showProximityLabel =
          !showPersistentLabel && world.config.style.nodeMarkerStyle.labelOnProximity && canOpenNodeNow;
        const labelOffset = node.labelOffset ?? { x: 0, y: 1.1, z: 0 };
        const labelText = node.labelText ?? world.nodesById[node.id]?.name ?? node.id;

        return (
          <group key={node.id} position={[node.scenePosition.x, node.scenePosition.y, node.scenePosition.z]}>
            <mesh
              onPointerOver={(event) => {
                event.stopPropagation();
                if (!canOpenNodeNow) {
                  return;
                }
                dispatch({ type: "HOVERED_NODE_CHANGED", nodeId: node.id });
              }}
              onPointerOut={(event) => {
                event.stopPropagation();
                if (state.hoveredNodeId === node.id) {
                  dispatch({ type: "HOVERED_NODE_CHANGED", nodeId: undefined });
                }
              }}
              onClick={() => {
                if (state.worldState !== "exploring" || !isAvailable) {
                  return;
                }
                if (!worldNode) {
                  return;
                }
                const inRange = isInsideNodeRadius(state.player.position, worldNode);
                if (!inRange) {
                  return;
                }

                dispatch({ type: "OPEN_CHECKPOINT", nodeId: node.id });
              }}
            >
              <sphereGeometry args={[0.85, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>

            {canOpenNodeNow ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
                <ringGeometry args={[0.85, isHovered ? 1.18 : 1.1, 24]} />
                <meshBasicMaterial
                  color={world.config.style.pathStyle.highlightColor}
                  transparent
                  opacity={isHovered ? 0.95 : 0.8}
                  depthTest
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ) : null}

            {showPersistentLabel || showProximityLabel ? (
              <Html
                distanceFactor={14}
                position={[labelOffset.x, labelOffset.y, labelOffset.z]}
                center
                occlude={false}
              >
                <div className={`node-label ${showPersistentLabel ? "node-label--key" : ""}`}>{labelText}</div>
              </Html>
            ) : null}
          </group>
        );
      })}
    </group>
  );
}
