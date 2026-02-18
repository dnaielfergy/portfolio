import { useMemo, useRef, useState } from "react";
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Color } from "three";
import type { Mesh } from "three";

import {
  buildIntroRouteFromEdges,
  computeCandidateEdges,
  computeEdgeVisualState,
  resolvePathStyle,
  type EdgeVisualState,
  type ResolvedPathStyle,
} from "./edgeVisualState";
import { getEdgeStrokePoints } from "../data/loadWorldConfig";
import { createProgressionEngine } from "../domain/progressionEngine";
import { useWorldStoreContext } from "../state/worldStore";
import type { SceneCoords } from "../types/world";

interface EdgeStrokeProps {
  edgeId: string;
  points: [number, number, number][];
  isMain: boolean;
  isCurrent: boolean;
  isHovered: boolean;
  visualState: EdgeVisualState;
  pathStyle: ResolvedPathStyle;
  overlayOpacityScale?: number;
}

interface MaterialCarrier {
  material?: {
    opacity: number;
    linewidth?: number;
    transparent: boolean;
  };
}

function toLineMaterial(
  object: MaterialCarrier | null,
): { opacity: number; linewidth?: number; transparent: boolean } | null {
  if (!object) {
    return null;
  }
  return object.material ?? null;
}

function hashPhase(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

function resolvePalette(visualState: EdgeVisualState, pathStyle: ResolvedPathStyle): {
  borderColor: string;
  coreColor: string;
  sheenColor: string;
  borderOpacity: number;
  coreOpacity: number;
  sheenOpacity: number;
} {
  const darken = (color: string, scalar: number): string =>
    new Color(color).multiplyScalar(scalar).offsetHSL(0.01, 0.01, -0.03).getStyle();
  const brighten = (color: string, blend = 0.3): string =>
    new Color(color).lerp(new Color("#fff7dc"), blend).getStyle();

  switch (visualState) {
    case "intro":
      return {
        borderColor: darken(pathStyle.nextColor, 0.68),
        coreColor: pathStyle.nextColor,
        sheenColor: brighten(pathStyle.nextColor, 0.45),
        borderOpacity: 0.62,
        coreOpacity: 0.92,
        sheenOpacity: 0.44,
      };
    case "completed":
      return {
        borderColor: darken(pathStyle.completedColor, 0.7),
        coreColor: pathStyle.completedColor,
        sheenColor: brighten(pathStyle.completedColor, 0.3),
        borderOpacity: 0.57,
        coreOpacity: 0.9,
        sheenOpacity: 0.34,
      };
    case "next":
      return {
        borderColor: darken(pathStyle.nextColor, 0.68),
        coreColor: pathStyle.nextColor,
        sheenColor: brighten(pathStyle.nextColor, 0.42),
        borderOpacity: 0.6,
        coreOpacity: 0.92,
        sheenOpacity: 0.42,
      };
    default:
      return {
        borderColor: darken(pathStyle.loadedColor, 0.65),
        coreColor: pathStyle.loadedColor,
        sheenColor: brighten(pathStyle.loadedColor, 0.2),
        borderOpacity: 0.42,
        coreOpacity: 0.74,
        sheenOpacity: 0.18,
      };
  }
}

function EdgeStroke({
  edgeId,
  points,
  isMain,
  isCurrent,
  isHovered,
  visualState,
  pathStyle,
  overlayOpacityScale = 1,
}: EdgeStrokeProps): React.JSX.Element {
  const borderRef = useRef<MaterialCarrier | null>(null);
  const coreRef = useRef<MaterialCarrier | null>(null);
  const sheenRef = useRef<MaterialCarrier | null>(null);
  const phase = useMemo(() => hashPhase(edgeId), [edgeId]);
  const palette = useMemo(() => resolvePalette(visualState, pathStyle), [visualState, pathStyle]);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    const introPulse =
      0.9 +
      0.1 * Math.sin(((elapsed * 1000) / Math.max(1, pathStyle.introSweepMs)) * Math.PI * 2 + phase * Math.PI * 2);
    const nextPulse = 0.92 + 0.08 * Math.sin(elapsed * 3 + phase * Math.PI * 2);
    const statePulse = visualState === "intro" ? introPulse : visualState === "next" ? nextPulse : 1;

    const interactionBoost = isHovered ? 1.16 : isCurrent ? 1.08 : 1;
    const opacityScale = overlayOpacityScale * interactionBoost * statePulse;

    const borderMaterial = toLineMaterial(borderRef.current);
    if (borderMaterial) {
      borderMaterial.opacity = Math.min(1, palette.borderOpacity * opacityScale);
      borderMaterial.transparent = true;
    }

    const coreMaterial = toLineMaterial(coreRef.current);
    if (coreMaterial) {
      coreMaterial.opacity = Math.min(1, palette.coreOpacity * opacityScale);
      coreMaterial.transparent = true;
    }

    const sheenMaterial = toLineMaterial(sheenRef.current);
    if (sheenMaterial) {
      sheenMaterial.opacity = Math.min(1, palette.sheenOpacity * opacityScale);
      sheenMaterial.transparent = true;
    }
  });

  const baseThickness = (isMain ? 10.2 : 6.6) * Math.max(0.5, pathStyle.thickness);
  const widthBoost = isHovered ? 1.1 : isCurrent ? 1.06 : visualState === "next" ? 1.04 : 1;

  return (
    <group>
      <Line
        ref={(instance) => {
          borderRef.current = instance as MaterialCarrier | null;
        }}
        points={points}
        color={palette.borderColor}
        lineWidth={baseThickness * widthBoost}
        transparent
        opacity={palette.borderOpacity * overlayOpacityScale}
      />
      <Line
        ref={(instance) => {
          coreRef.current = instance as MaterialCarrier | null;
        }}
        points={points}
        color={palette.coreColor}
        lineWidth={baseThickness * 0.74 * widthBoost}
        transparent
        opacity={palette.coreOpacity * overlayOpacityScale}
      />
      <Line
        ref={(instance) => {
          sheenRef.current = instance as MaterialCarrier | null;
        }}
        points={points}
        color={palette.sheenColor}
        lineWidth={baseThickness * 0.34 * widthBoost}
        transparent
        opacity={palette.sheenOpacity * overlayOpacityScale}
      />
    </group>
  );
}

function samplePolyline(points: SceneCoords[], progress: number): SceneCoords {
  if (points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  if (points.length === 1) {
    return points[0] ?? { x: 0, y: 0, z: 0 };
  }

  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (!a || !b) {
      continue;
    }
    const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
    segmentLengths.push(length);
    total += length;
  }

  const clamped = Math.min(1, Math.max(0, progress));
  const targetDistance = total * clamped;

  let travelled = 0;
  for (let i = 0; i < segmentLengths.length; i += 1) {
    const segmentLength = segmentLengths[i];
    if (segmentLength === undefined) {
      continue;
    }

    const nextDistance = travelled + segmentLength;
    if (targetDistance <= nextDistance) {
      const alpha = segmentLength > 0 ? (targetDistance - travelled) / segmentLength : 0;
      const from = points[i];
      const to = points[i + 1];
      if (!from || !to) {
        continue;
      }

      return {
        x: from.x + (to.x - from.x) * alpha,
        y: from.y + (to.y - from.y) * alpha,
        z: from.z + (to.z - from.z) * alpha,
      };
    }

    travelled = nextDistance;
  }

  return points[points.length - 1] ?? { x: 0, y: 0, z: 0 };
}

export function PathLayer(): React.JSX.Element {
  const { world, state } = useWorldStoreContext();
  const introElapsedRef = useRef(0);
  const previousWorldStateRef = useRef(state.worldState);
  const introFadeRemainingMsRef = useRef(0);
  const introHeadRef = useRef<Mesh>(null);
  const [introOverlayAlpha, setIntroOverlayAlpha] = useState(state.worldState === "intro" ? 1 : 0);
  const introOverlayAlphaRef = useRef(introOverlayAlpha);

  const engine = useMemo(() => createProgressionEngine(world, state.progression), [state.progression, world]);
  const pathStyle = useMemo(() => resolvePathStyle(world.config.style.pathStyle), [world.config.style.pathStyle]);

  const visibleEdgeIds = useMemo(() => {
    return new Set(world.renderEdges.filter((edge) => engine.isEdgeVisible(edge.id)).map((edge) => edge.id));
  }, [engine, world.renderEdges]);

  const baseEdges = useMemo(
    () =>
      computeCandidateEdges({
        worldState: state.worldState,
        edges: world.renderEdges,
        visibleEdgeIds,
      }),
    [state.worldState, visibleEdgeIds, world.renderEdges],
  );

  const introRoute = useMemo(
    () =>
      buildIntroRouteFromEdges({
        renderEdges: world.renderEdges,
        mainSequence: world.config.progression.mainSequence,
        startNodeId: world.config.intro.pathTrace.startNodeId,
        endNodeId: world.config.intro.pathTrace.endNodeId,
        elevation: 0.35,
      }),
    [
      world.renderEdges,
      world.config.intro.pathTrace.endNodeId,
      world.config.intro.pathTrace.startNodeId,
      world.config.progression.mainSequence,
    ],
  );

  useFrame((_, delta) => {
    const deltaMs = delta * 1000;

    if (state.worldState === "intro") {
      introElapsedRef.current += deltaMs;
      introFadeRemainingMsRef.current = pathStyle.stateFadeMs;
      if (introOverlayAlphaRef.current !== 1) {
        introOverlayAlphaRef.current = 1;
        setIntroOverlayAlpha(1);
      }
    } else {
      if (previousWorldStateRef.current === "intro") {
        introFadeRemainingMsRef.current = pathStyle.stateFadeMs;
      } else if (introFadeRemainingMsRef.current > 0) {
        introFadeRemainingMsRef.current = Math.max(0, introFadeRemainingMsRef.current - deltaMs);
      }

      const nextAlpha =
        pathStyle.stateFadeMs <= 0 ? 0 : Math.min(1, introFadeRemainingMsRef.current / pathStyle.stateFadeMs);
      if (Math.abs(nextAlpha - introOverlayAlphaRef.current) > 0.005 || (nextAlpha === 0 && introOverlayAlphaRef.current !== 0)) {
        introOverlayAlphaRef.current = nextAlpha;
        setIntroOverlayAlpha(nextAlpha);
      }
      introElapsedRef.current = 0;
    }

    previousWorldStateRef.current = state.worldState;

    if (
      introHeadRef.current &&
      world.config.intro.pathTrace.enabled &&
      introRoute.length > 1 &&
      (state.worldState === "intro" || introOverlayAlphaRef.current > 0.001)
    ) {
      const duration = Math.max(1, world.config.intro.pathTrace.durationMs);
      const introProgress = Math.min(1, introElapsedRef.current / duration);
      const introHead = samplePolyline(introRoute, introProgress);
      introHeadRef.current.position.set(introHead.x, introHead.y, introHead.z);
    }
  });

  return (
    <group>
      {state.worldState !== "intro"
        ? baseEdges.map((edge) => {
            const visualState = computeEdgeVisualState({
              edge,
              progression: state.progression,
              worldState: state.worldState,
            });
            const isMain = edge.type === "main";
            const isCurrent = edge.from === state.activeNodeId || edge.to === state.activeNodeId;
            const isHovered =
              !!state.hoveredNodeId && (edge.from === state.hoveredNodeId || edge.to === state.hoveredNodeId);

            return (
              <EdgeStroke
                key={edge.id}
                edgeId={edge.id}
                points={getEdgeStrokePoints(edge)}
                isMain={isMain}
                isCurrent={isCurrent}
                isHovered={isHovered}
                visualState={visualState}
                pathStyle={pathStyle}
              />
            );
          })
        : null}

      {introOverlayAlpha > 0.001
        ? world.renderEdges.map((edge) => {
            const isMain = edge.type === "main";
            const isCurrent = edge.from === state.activeNodeId || edge.to === state.activeNodeId;
            const isHovered =
              !!state.hoveredNodeId && (edge.from === state.hoveredNodeId || edge.to === state.hoveredNodeId);

            return (
              <EdgeStroke
                key={`intro-${edge.id}`}
                edgeId={`intro-${edge.id}`}
                points={getEdgeStrokePoints(edge)}
                isMain={isMain}
                isCurrent={isCurrent}
                isHovered={isHovered}
                visualState="intro"
                pathStyle={pathStyle}
                overlayOpacityScale={introOverlayAlpha}
              />
            );
          })
        : null}

      {(state.worldState === "intro" || introOverlayAlpha > 0.001) &&
      world.config.intro.pathTrace.enabled &&
      introRoute.length > 1 ? (
        <>
          <Line
            points={introRoute.map((point) => [point.x, point.y, point.z])}
            color={pathStyle.nextColor}
            lineWidth={5.4}
            transparent
            opacity={0.24 * introOverlayAlpha}
          />
          <Line
            points={introRoute.map((point) => [point.x, point.y, point.z])}
            color="#fff4c6"
            lineWidth={2.6}
            transparent
            opacity={0.32 * introOverlayAlpha}
          />
          <mesh ref={introHeadRef}>
            <sphereGeometry args={[0.58, 20, 20]} />
            <meshStandardMaterial
              color={pathStyle.nextColor}
              emissive={pathStyle.nextColor}
              emissiveIntensity={1.05}
              transparent
              opacity={introOverlayAlpha}
            />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
