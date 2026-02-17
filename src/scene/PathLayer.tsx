import { useMemo } from "react";

import { createProgressionEngine } from "../domain/progressionEngine";
import { useWorldStoreContext } from "../state/worldStore";

export function PathLayer(): JSX.Element {
  const { world, state } = useWorldStoreContext();

  const visibleEdgeCount = useMemo(() => {
    const engine = createProgressionEngine(world, state.progression);
    return world.config.edges.filter((edge) => engine.isEdgeVisible(edge.id)).length;
  }, [state.progression, world]);

  return (
    <div className="scene-block" data-testid="path-layer">
      <strong>PathLayer</strong>
      <p>visible edges: {visibleEdgeCount}</p>
    </div>
  );
}
