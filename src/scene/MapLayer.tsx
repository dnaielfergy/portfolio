import { useWorldStoreContext } from "../state/worldStore";

export function MapLayer(): JSX.Element {
  const {
    world: { config },
  } = useWorldStoreContext();

  return (
    <div className="scene-block" data-testid="map-layer">
      <strong>MapLayer</strong>
      <p>source: {config.assets.mapImage}</p>
    </div>
  );
}
