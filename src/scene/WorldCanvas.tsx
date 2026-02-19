import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import { CameraRig } from "../camera/CameraRig";
import { toSceneCoords } from "../data/loadWorldConfig";
import { PostFXManager } from "../postfx/PostFXManager";
import { useWorldStoreContext } from "../state/worldStore";
import { useCameraCalibration } from "../tuning/cameraCalibrationContext";
import { CharacterRig } from "./CharacterRig";
import { EnvironmentLayer } from "./EnvironmentLayer";
import { MapLayer } from "./MapLayer";
import { NodeMarkers } from "./NodeMarkers";
import { NodePositionProbe } from "./NodePositionProbe";
import { PathLayer } from "./PathLayer";
import { VehicleRig } from "./VehicleRig";

function SceneContent(): React.JSX.Element {
  const { world, state } = useWorldStoreContext();
  const { activeWorldVisualMultiplier } = useCameraCalibration();
  const checkpointNode = state.checkpointNodeId ? world.nodesById[state.checkpointNodeId] : undefined;
  const scaleAnchor =
    state.worldState === "checkpointOpen" && checkpointNode
      ? toSceneCoords(checkpointNode.coords.x, checkpointNode.coords.y, 0)
      : toSceneCoords(state.player.position.x, state.player.position.y, 0);
  const worldGroupPosition: [number, number, number] = [
    scaleAnchor.x * (1 - activeWorldVisualMultiplier),
    scaleAnchor.y * (1 - activeWorldVisualMultiplier),
    scaleAnchor.z * (1 - activeWorldVisualMultiplier),
  ];

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[25, 50, 20]} intensity={1.1} castShadow />
      <hemisphereLight intensity={0.3} groundColor="#0f151d" color="#d5dde7" />

      <group
        position={worldGroupPosition}
        scale={[activeWorldVisualMultiplier, activeWorldVisualMultiplier, activeWorldVisualMultiplier]}
      >
        <MapLayer />
        <EnvironmentLayer />
        <PathLayer />
        <NodeMarkers />
        <NodePositionProbe />
        <VehicleRig />
        <CharacterRig />
      </group>
      <CameraRig />
      <PostFXManager />
    </>
  );
}

export function WorldCanvas(): React.JSX.Element {
  return (
    <section className="world-canvas" aria-label="World Canvas">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true }}
        camera={{
          position: [0, 65, 110],
          fov: 42,
          near: 0.1,
          far: import.meta.env.DEV ? 550 : 450,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </section>
  );
}
