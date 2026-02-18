import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";

import { createCameraController } from "./cameraController";
import { useWorldStoreContext } from "../state/worldStore";

export function CameraRig(): null {
  const {
    world,
    state,
  } = useWorldStoreContext();
  const { camera } = useThree();
  const controller = useMemo(
    () =>
      createCameraController({
        presets: world.config.cameraPresets,
      }),
    [world.config.cameraPresets],
  );
  const initializedRef = useRef(false);
  const previousStateRef = useRef(state.worldState);

  useFrame((_, delta) => {
    const checkpointNode = state.checkpointNodeId ? world.nodesById[state.checkpointNodeId] : undefined;
    const context = {
      state: state.worldState,
      playerPosition: state.player.position,
      playerVelocity: state.player.velocity,
      intro: world.config.intro,
      checkpointNodePosition: checkpointNode?.coords,
      transformProgress: state.transform.progress,
      transformMicroZoomPercent: world.config.vehicles.transformRules.cameraMicroZoomPercent,
    };

    if (!initializedRef.current) {
      controller.setState(state.worldState, context, { immediate: true });
      initializedRef.current = true;
      previousStateRef.current = state.worldState;
    } else if (previousStateRef.current !== state.worldState) {
      controller.setState(state.worldState, context);
      previousStateRef.current = state.worldState;
    }

    const snapshot = controller.update(delta * 1000, context);


    camera.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    camera.lookAt(snapshot.lookAt.x, snapshot.lookAt.y, snapshot.lookAt.z);
    if ("fov" in camera) {
      (camera as PerspectiveCamera).fov = snapshot.fov;
      (camera as PerspectiveCamera).updateProjectionMatrix();
    } else {
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
