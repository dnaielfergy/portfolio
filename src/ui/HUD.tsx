import { useWorldStoreContext } from "../state/worldStore";

export function HUD(): React.JSX.Element {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  return (
    <header className="hud" data-testid="hud">
      <span>{config.meta.title}</span>
      {config.ui.hud.showProgress ? (
        <span>
          progress: {state.progression.completedNodeIds.size}/{config.progression.mainSequence.length}
        </span>
      ) : null}
      {config.ui.hud.showResumeLink ? (
        <a href={config.meta.resumePdfUrl} target="_blank" rel="noreferrer">
          {config.ui.hud.resumeLabel}
        </a>
      ) : null}
    </header>
  );
}
