import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

import { CameraRig } from "../camera/CameraRig";
import { PostFXManager } from "../postfx/PostFXManager";
import { CharacterRig } from "./CharacterRig";
import { EnvironmentLayer } from "./EnvironmentLayer";
import { MapLayer } from "./MapLayer";
import { NodeMarkers } from "./NodeMarkers";
import { PathLayer } from "./PathLayer";
import { VehicleRig } from "./VehicleRig";

function SceneContent(): React.JSX.Element {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[25, 50, 20]} intensity={1.1} castShadow />
      <hemisphereLight intensity={0.3} groundColor="#0f151d" color="#d5dde7" />

      <MapLayer />
      <EnvironmentLayer />
      <PathLayer />
      <NodeMarkers />
      <VehicleRig />
      <CharacterRig />
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
          far: 450,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </section>
  );
}
