import { useMemo } from "react";

import { createCameraController } from "./cameraController";
import { useWorldStoreContext } from "../state/worldStore";

export function CameraRig(): JSX.Element {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  const controller = useMemo(() => createCameraController(config.cameraPresets), [config.cameraPresets]);
  const snapshot = controller.setState(state.worldState, {
    state: state.worldState,
    playerPosition: state.player.position,
    playerVelocity: state.player.velocity,
  });

  return (
    <div data-testid="camera-rig" className="camera-debug">
      camera: {snapshot.presetKey} | zoom {snapshot.zoomDeltaPercent}%
    </div>
  );
}
