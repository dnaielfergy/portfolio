import { useWorldStoreContext } from "../state/worldStore";

export function StartOverlay(): JSX.Element | null {
  const {
    world: { config },
    state,
    dispatch,
  } = useWorldStoreContext();

  if (state.worldState !== "idleMap") {
    return null;
  }

  return (
    <div className="overlay center" data-testid="start-overlay">
      <button onClick={() => dispatch({ type: "START_CLICKED" })}>{config.ui.startButton.label}</button>
    </div>
  );
}
