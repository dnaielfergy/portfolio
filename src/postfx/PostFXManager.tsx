import { useMemo } from "react";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

import { SCENE_SCALE } from "../data/loadWorldConfig";
import { useWorldStoreContext } from "../state/worldStore";
import type { RuntimeWorldStore, WorldState } from "../types/world";

interface PostFxProfile {
  fogNear: number;
  fogFar: number;
  dof: number;
  bloom: number;
  noise: number;
}

const BASELINE_SCENE_SCALE = 1;
const FOG_RANGE_SCALE = SCENE_SCALE / BASELINE_SCENE_SCALE;

function buildProfile(
  worldState: WorldState,
  transformProgress: number,
  qualityTier: RuntimeWorldStore["qualityTier"],
  fog: { introFogOpacity: number; settleFogOpacity: number; sfFogOpacity: number },
): PostFxProfile {
  const fogLerp = (opacity: number): { near: number; far: number } => {
    const near = 22 + opacity * 120;
    const far = 210 - opacity * 85;
    return {
      near: near * FOG_RANGE_SCALE,
      far: far * FOG_RANGE_SCALE,
    };
  };

  if (worldState === "intro") {
    const fogRange = fogLerp(fog.introFogOpacity);
    return { fogNear: fogRange.near, fogFar: fogRange.far, dof: 0.04, bloom: 0.45, noise: 0 };
  }

  if (worldState === "checkpointOpen") {
    const fogRange = fogLerp(fog.settleFogOpacity);
    return {
      fogNear: fogRange.near,
      fogFar: fogRange.far,
      dof: qualityTier === "low" ? 0.01 : 0.07,
      bloom: 0.2,
      noise: 0,
    };
  }

  if (worldState === "transforming") {
    const fogRange = fogLerp(fog.settleFogOpacity);
    const midSpin = transformProgress > 0.2 && transformProgress < 0.8;
    return {
      fogNear: fogRange.near,
      fogFar: fogRange.far,
      dof: 0.03,
      bloom: midSpin ? 0.35 : 0.15,
      noise: midSpin ? 0.18 : 0,
    };
  }

  if (worldState === "finalState") {
    const fogRange = fogLerp(fog.sfFogOpacity);
    return { fogNear: fogRange.near, fogFar: fogRange.far, dof: 0.05, bloom: 0.25, noise: 0 };
  }

  const fogRange = fogLerp(fog.settleFogOpacity);
  return {
    fogNear: fogRange.near,
    fogFar: fogRange.far,
    dof: qualityTier === "low" ? 0 : 0.015,
    bloom: 0.08,
    noise: 0,
  };
}

export function PostFXManager(): React.JSX.Element {
  const {
    world: { config },
    state,
  } = useWorldStoreContext();

  const profile = useMemo<PostFxProfile>(
    () =>
      buildProfile(
        state.worldState,
        state.transform.progress,
        state.qualityTier,
        config.style.fogStyle,
      ),
    [config.style.fogStyle, state.qualityTier, state.transform.progress, state.worldState],
  );

  return (
    <>
      <fog attach="fog" args={["#a5afba", profile.fogNear, profile.fogFar]} />
      <EffectComposer multisampling={state.qualityTier === "high" ? 4 : 0}>
        <DepthOfField
          focusDistance={0.01}
          focalLength={state.qualityTier === "low" ? 0 : profile.dof}
          bokehScale={state.worldState === "checkpointOpen" ? 2.5 : 1.2}
          height={480}
        />
        <Bloom mipmapBlur intensity={profile.bloom} luminanceThreshold={0.5} />
        <Noise premultiply opacity={profile.noise} />
        <Vignette darkness={0.5} offset={0.2} />
      </EffectComposer>
    </>
  );
}
