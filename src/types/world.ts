export type WorldState =
  | "intro"
  | "idleMap"
  | "tutorial"
  | "focusCharlotte"
  | "exploring"
  | "checkpointOpen"
  | "transforming"
  | "finalState";

export type NodeType = "main" | "side" | "final";
export type EdgeType = "main" | "side";
export type NodeId = string;
export type EdgeId = string;

export interface WorldMeta {
  worldId: string;
  version: string;
  title: string;
  resumePdfUrl: string;
}

export interface AssetCatalog {
  mapImage: string;
  referenceImages: Record<string, string>;
  models?: Record<string, string>;
  textures?: Record<string, string>;
}

export interface StyleConfig {
  materials: {
    finish: "matte";
    roundEdges: boolean;
    noPhotorealism: boolean;
    noHighFreqTextures: boolean;
  };
  pathStyle: {
    baseColor: string;
    highlightColor: string;
    thickness: number;
    elevation: number;
    pulseOnIntro: boolean;
    traceDurationMs: number;
  };
  nodeMarkerStyle: {
    shape: "disc";
    defaultScale: number;
    completedColor: string;
    hoverGlow: boolean;
    labelOnProximity: boolean;
  };
  fogStyle: {
    introFogOpacity: number;
    settleFogOpacity: number;
    sfFogOpacity: number;
  };
  regionPalettes: Record<
    string,
    {
      primary: string;
      secondary: string;
      accent: string;
    }
  >;
}

export interface IntroConfig {
  enabled: boolean;
  durationMs: number;
  startPreset: string;
  endPreset: string;
  skipOnInput: boolean;
  settleToState: "idleMap";
  pathTrace: {
    enabled: boolean;
    startNodeId: NodeId;
    endNodeId: NodeId;
    durationMs: number;
    glowColor: string;
    pulseNodes: boolean;
  };
  fogAnimation: {
    startOpacity: number;
    endOpacity: number;
    easing: string;
  };
}

export interface CameraPreset {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
  damping: number;
}

export interface CameraPresetMap {
  introStart: CameraPreset;
  introEnd: CameraPreset;
  focusCharlotte: CameraPreset;
  checkpointDefault: CameraPreset;
  finalSF: CameraPreset;
}

export interface UIConfig {
  startButton: {
    label: string;
    centered: boolean;
  };
  tutorial: {
    title: string;
    lines: string[];
    dismissOnAnyInput: boolean;
  };
  hud: {
    showProgress: boolean;
    showResumeLink: boolean;
    resumeLabel: string;
  };
  checkpointPanel: {
    titleSuffix: string;
    openKey: "Enter";
    closeKey: "Escape";
    slideFrom: "right";
    widthPercent: number;
    blurBackground: boolean;
  };
}

export interface VehicleStage {
  id: string;
  label: string;
  ref: string;
}

export interface VehicleConfig {
  stages: VehicleStage[];
  transformRules: {
    durationMs: number;
    spinDegrees: 360;
    swapAtPercent: number;
    motionBlur: boolean;
    dustPuff: boolean;
    cameraMicroZoomPercent: number;
  };
  stageByNodeId: Record<NodeId, string>;
}

export type UnlockRule =
  | { type: "start" }
  | { type: "after_complete"; nodeId: NodeId }
  | { type: "after_available"; nodeId: NodeId };

export type CompletionRule = { type: "open_checkpoint_once" } | { type: "enter_node" };

export interface WorldNode {
  id: NodeId;
  name: string;
  type: NodeType;
  region: string;
  coords: {
    x: number;
    y: number;
  };
  radius: number;
  marker: {
    label: boolean;
    icon: string;
  };
  checkpointContentRef: string;
  unlock: UnlockRule;
  completion: CompletionRule;
  landmarks?: Array<{ id: string; label: string }>;
}

export type VisibleRule =
  | { type: "always" }
  | { type: "after_available"; nodeId: NodeId }
  | { type: "after_complete"; nodeId: NodeId };

export interface WorldEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  type: EdgeType;
  visibleWhen: VisibleRule;
  styleKey?: string;
  waypoints?: Array<{ x: number; y: number }>;
}

export interface ProgressionConfig {
  startNodeId: NodeId;
  finalNodeId: NodeId;
  mainSequence: NodeId[];
  sideQuests: Record<NodeId, NodeId[]>;
  onCompleteNode: {
    setNodeCompletedColor: string;
    enableNextEdgeGlow: boolean;
    triggerTransform: boolean;
  };
  onEnterFinal: {
    lockMovement: boolean;
    increaseFog: boolean;
    showResumeCTA: boolean;
    showFutureLevelsText: boolean;
  };
}

export interface WorldConfig {
  meta: WorldMeta;
  assets: AssetCatalog;
  style: StyleConfig;
  intro: IntroConfig;
  cameraPresets: CameraPresetMap;
  ui: UIConfig;
  vehicles: VehicleConfig;
  nodes: WorldNode[];
  edges: WorldEdge[];
  progression: ProgressionConfig;
}

export interface PlayerState {
  nodeId: NodeId;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  movementLocked: boolean;
}

export interface RuntimeProgression {
  availableNodeIds: Set<NodeId>;
  completedNodeIds: Set<NodeId>;
}

export interface NormalizedWorld {
  config: WorldConfig;
  nodesById: Record<NodeId, WorldNode>;
  edgesById: Record<EdgeId, WorldEdge>;
  adjacency: Record<NodeId, NodeId[]>;
}

export interface RuntimeWorldStore {
  worldState: WorldState;
  activeNodeId: NodeId;
  isCheckpointOpen: boolean;
  checkpointNodeId?: NodeId;
  activeVehicleStageId: string;
  player: PlayerState;
  progression: RuntimeProgression;
  qualityTier: "high" | "medium" | "low";
}
