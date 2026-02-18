import { useEffect, useRef, useState } from "react";

import { loadCheckpointContent } from "../data/loadCheckpointContent";
import { useWorldStoreContext } from "../state/worldStore";
import { trapFocus } from "./focusTrap";
import { CheckpointContent } from "./CheckpointContent";
import type { ParsedCheckpointContent } from "../types/checkpoint";

export function CheckpointPanel(): React.JSX.Element | null {
  const {
    world,
    state,
    dispatch,
  } = useWorldStoreContext();
  const { config } = world;
  const [content, setContent] = useState<ParsedCheckpointContent | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!state.checkpointNodeId || state.worldState !== "checkpointOpen") {
      return;
    }

    loadCheckpointContent(state.checkpointNodeId, config)
      .then(setContent)
      .catch((error: unknown) => {
        console.error(error);
        setContent(null);
      });
  }, [config, state.checkpointNodeId, state.worldState]);

  useEffect(() => {
    if (!panelRef.current || state.worldState !== "checkpointOpen") {
      return;
    }

    const untrap = trapFocus(panelRef.current);
    panelRef.current.focus();
    return untrap;
  }, [state.worldState]);

  if (state.worldState !== "checkpointOpen") {
    return null;
  }

  const checkpointTitle = state.checkpointNodeId
    ? `${world.nodesById[state.checkpointNodeId]?.name ?? state.checkpointNodeId}${config.ui.checkpointPanel.titleSuffix}`
    : "Checkpoint";

  return (
    <aside
      className="checkpoint-panel"
      data-testid="checkpoint-panel"
      ref={panelRef}
      tabIndex={-1}
      style={{ width: `min(${config.ui.checkpointPanel.widthPercent}vw, 680px)` }}
    >
      <div className="checkpoint-panel-header">
        <h2>{checkpointTitle}</h2>
        <button onClick={() => dispatch({ type: "CLOSE_CHECKPOINT" })}>Close (Esc)</button>
      </div>
      {content ? <CheckpointContent content={content} /> : <p>Loading checkpoint content...</p>}
    </aside>
  );
}
