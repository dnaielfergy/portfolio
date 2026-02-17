import { useEffect, useRef, useState } from "react";

import { loadCheckpointContent } from "../data/loadCheckpointContent";
import { useWorldStoreContext } from "../state/worldStore";
import { trapFocus } from "./focusTrap";
import { CheckpointContent } from "./CheckpointContent";
import type { ParsedCheckpointContent } from "../types/checkpoint";

export function CheckpointPanel(): JSX.Element | null {
  const {
    world: { config },
    state,
    dispatch,
  } = useWorldStoreContext();
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

  return (
    <aside className="checkpoint-panel" data-testid="checkpoint-panel" ref={panelRef} tabIndex={-1}>
      <div className="checkpoint-panel-header">
        <h2>{state.checkpointNodeId ? `${state.checkpointNodeId}${config.ui.checkpointPanel.titleSuffix}` : "Checkpoint"}</h2>
        <button onClick={() => dispatch({ type: "CLOSE_CHECKPOINT" })}>Close (Esc)</button>
      </div>
      {content ? <CheckpointContent content={content} /> : <p>Loading checkpoint content...</p>}
    </aside>
  );
}
