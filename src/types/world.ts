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
    loadedColor?: string;
    completedColor?: string;
    nextColor?: string;
    thickness: number;
    elevation: number;
    pulseOnIntro: boolean;
    traceDurationMs: number;
    introSweepMs?: number;
    stateFadeMs?: number;
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
  scale?: {
    worldVisualMultiplier: number;
    vehicleVisualMultiplier: number;
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
  collider?: {
    shape: "circle";
    radius: number;
  };
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

export interface EnvironmentObject {
  id: string;
  position: {
    x: number;
    y: number;
    elevation?: number;
  };
  size: {
    width: number;
    depth: number;
    height: number;
  };
  rotation?: number;
  styleKey?: string;
}

export interface EnvironmentCollisionConfig {
  enabled: boolean;
  playerRadius: number;
  maxSlideIterations: number;
}

export interface EnvironmentConfig {
  buildings: Array<EnvironmentObject & { collider?: boolean }>;
  props?: EnvironmentObject[];
  collision: EnvironmentCollisionConfig;
}

export interface EnvironmentManifestRef {
  manifestRef: string;
}

export type EnvironmentConfigSource = EnvironmentConfig | EnvironmentManifestRef;

export interface EnvironmentKitModule {
  id: string;
  size: {
    width: number;
    depth: number;
    height: number;
  };
  rotation?: number;
  styleKey?: string;
  colliderByDefault?: boolean;
  modelRef?: string;
}

export interface EnvironmentKit {
  id: string;
  modules: EnvironmentKitModule[];
}

export interface EnvironmentPlacement {
  id: string;
  moduleId?: string;
  position: {
    x: number;
    y: number;
    elevation?: number;
  };
  size?: {
    width: number;
    depth: number;
    height: number;
  };
  rotation?: number;
  styleKey?: string;
  collider?: boolean;
}

export interface EnvironmentRegion {
  id: string;
  buildings: EnvironmentPlacement[];
  props?: EnvironmentPlacement[];
}

export interface EnvironmentManifest {
  version: string;
  collision: EnvironmentCollisionConfig;
  kitRefs: string[];
  regionRefs: string[];
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
  mapAnchorPx?: {
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
  renderWaypointsPx?: Array<{ x: number; y: number }>;
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
  environment: EnvironmentConfig;
  nodes: WorldNode[];
  edges: WorldEdge[];
  progression: ProgressionConfig;
}

export interface WorldConfigSource extends Omit<WorldConfig, "environment"> {
  environment: EnvironmentConfigSource;
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

export interface SceneCoords {
  x: number;
  y: number;
  z: number;
}

export interface RenderNode {
  id: NodeId;
  nodeType: NodeType;
  region: string;
  radius: number;
  scenePosition: SceneCoords;
  worldPosition: {
    x: number;
    y: number;
  };
  labelText?: string;
  labelPriority?: "key" | "normal";
  labelVisibleByDefault?: boolean;
  labelOffset?: SceneCoords;
}

export interface RenderEdge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  type: EdgeType;
  scenePoints: SceneCoords[];
  visibleWhen: VisibleRule;
}

export interface CameraRuntimeState {
  position: SceneCoords;
  lookAt: SceneCoords;
  fov: number;
  damping: number;
}

export interface TransformState {
  status: "idle" | "running";
  progress: number;
  fromStage: string;
  toStage: string;
}

export interface NormalizedWorld {
  config: WorldConfig;
  nodesById: Record<NodeId, WorldNode>;
  edgesById: Record<EdgeId, WorldEdge>;
  adjacency: Record<NodeId, NodeId[]>;
  renderNodes: RenderNode[];
  renderNodesById: Record<NodeId, RenderNode>;
  renderEdges: RenderEdge[];
}

export interface RuntimeWorldStore {
  worldState: WorldState;
  activeNodeId: NodeId;
  hoveredNodeId?: NodeId;
  isCheckpointOpen: boolean;
  checkpointNodeId?: NodeId;
  activeVehicleStageId: string;
  player: PlayerState;
  progression: RuntimeProgression;
  qualityTier: "high" | "medium" | "low";
  transform: TransformState;
  cameraRuntime: CameraRuntimeState;
}
