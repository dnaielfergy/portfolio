import { useEffect } from "react";

import type { WorldEvent } from "../types/events";
import type { WorldState } from "../types/world";

const MOVEMENT_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export interface KeyboardControllerOptions {
  worldState: WorldState;
  onEvent: (event: WorldEvent) => void;
  onMovementKey: (key: string, pressed: boolean) => void;
  onEnter: () => void;
  onEscape: () => void;
}

export function useKeyboardController({
  worldState,
  onEvent,
  onMovementKey,
  onEnter,
  onEscape,
}: KeyboardControllerOptions): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (worldState === "intro") {
        onEvent({ type: "INTRO_SKIPPED" });
        return;
      }

      if (worldState === "tutorial") {
        onEvent({ type: "TUTORIAL_DISMISSED" });
      }

      if (MOVEMENT_KEYS.has(event.key)) {
        onMovementKey(event.key, true);
      }

      if (event.key === "Enter") {
        onEnter();
      }

      if (event.key === "Escape") {
        onEscape();
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      if (MOVEMENT_KEYS.has(event.key)) {
        onMovementKey(event.key, false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onEnter, onEscape, onEvent, onMovementKey, worldState]);
}
