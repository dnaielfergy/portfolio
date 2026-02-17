import { CameraRig } from "../camera/CameraRig";
import { PostFXManager } from "../postfx/PostFXManager";
import { CharacterRig } from "./CharacterRig";
import { MapLayer } from "./MapLayer";
import { NodeMarkers } from "./NodeMarkers";
import { PathLayer } from "./PathLayer";
import { VehicleRig } from "./VehicleRig";

export function WorldCanvas(): JSX.Element {
  return (
    <section className="world-canvas" aria-label="World Canvas">
      <MapLayer />
      <PathLayer />
      <NodeMarkers />
      <CharacterRig />
      <VehicleRig />
      <CameraRig />
      <PostFXManager />
    </section>
  );
}
