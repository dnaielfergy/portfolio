import { useMemo } from "react";

import { useWorldStoreContext } from "../state/worldStore";

interface PostFxProfile {
  fog: number;
  dof: number;
  motionBlur: number;
}

export function PostFXManager(): JSX.Element {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  const profile = useMemo<PostFxProfile>(() => {
    if (state.worldState === "intro") {
      return { fog: config.style.fogStyle.introFogOpacity, dof: 0.2, motionBlur: 0 };
    }

    if (state.worldState === "checkpointOpen") {
      return { fog: config.style.fogStyle.settleFogOpacity, dof: 0.35, motionBlur: 0 };
    }

    if (state.worldState === "transforming") {
      return {
        fog: config.style.fogStyle.settleFogOpacity,
        dof: 0.15,
        motionBlur: config.vehicles.transformRules.motionBlur ? 0.3 : 0,
      };
    }

    if (state.worldState === "finalState") {
      return { fog: config.style.fogStyle.sfFogOpacity, dof: 0.2, motionBlur: 0 };
    }

    return { fog: config.style.fogStyle.settleFogOpacity, dof: 0.05, motionBlur: 0 };
  }, [config, state.worldState]);

  return (
    <div data-testid="postfx-manager" className="postfx-debug">
      fog {profile.fog.toFixed(2)} | dof {profile.dof.toFixed(2)} | blur {profile.motionBlur.toFixed(2)}
    </div>
  );
}
