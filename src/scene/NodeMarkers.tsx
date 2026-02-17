import { useWorldStoreContext } from "../state/worldStore";

export function NodeMarkers(): JSX.Element {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  return (
    <div className="scene-block" data-testid="node-markers">
      <strong>NodeMarkers</strong>
      <p>
        nodes: {config.nodes.length} | completed: {state.progression.completedNodeIds.size}
      </p>
    </div>
  );
}
