import { useWorldStoreContext } from "../state/worldStore";

export function VehicleRig(): JSX.Element {
  const {
    state: { activeVehicleStageId },
  } = useWorldStoreContext();

  return (
    <div className="scene-block" data-testid="vehicle-rig">
      <strong>VehicleRig</strong>
      <p>stage: {activeVehicleStageId}</p>
    </div>
  );
}
