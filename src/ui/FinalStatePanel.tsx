import { useWorldStoreContext } from "../state/worldStore";

export function FinalStatePanel(): React.JSX.Element | null {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  if (state.worldState !== "finalState") {
    return null;
  }

  return (
    <section className="overlay final-state" data-testid="final-state-panel">
      <h2>{config.meta.title}</h2>
      <p>Journey complete.</p>
      {config.progression.onEnterFinal.showResumeCTA ? (
        <a href={config.meta.resumePdfUrl} target="_blank" rel="noreferrer">
          {config.ui.hud.resumeLabel}
        </a>
      ) : null}
      {config.progression.onEnterFinal.showFutureLevelsText ? <p>Future levels coming soon.</p> : null}
    </section>
  );
}
