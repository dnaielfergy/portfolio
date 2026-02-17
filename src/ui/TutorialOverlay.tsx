import { useWorldStoreContext } from "../state/worldStore";

export function TutorialOverlay(): JSX.Element | null {
  const {
    world: { config },
    state,
    dispatch,
  } = useWorldStoreContext();

  if (state.worldState !== "tutorial") {
    return null;
  }

  return (
    <div className="overlay tutorial" data-testid="tutorial-overlay">
      <h2>{config.ui.tutorial.title}</h2>
      <ul>
        {config.ui.tutorial.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: "TUTORIAL_DISMISSED" })}>Continue</button>
    </div>
  );
}
