import { useWorldStoreContext } from "../state/worldStore";

export function CharacterRig(): JSX.Element {
  const {
    state: { player },
  } = useWorldStoreContext();

  return (
    <div className="scene-block" data-testid="character-rig">
      <strong>CharacterRig</strong>
      <p>
        x:{player.position.x.toFixed(1)} y:{player.position.y.toFixed(1)}
      </p>
    </div>
  );
}
