# World Schema Contract

This document defines the authoritative data model for the interactive portfolio overworld.

## 1. Top-Level Contract

`WorldConfig` fields:

- `meta` (required)
- `assets` (required)
- `style` (required)
- `intro` (required)
- `cameraPresets` (required)
- `ui` (required)
- `vehicles` (required)
- `environment` (required)
- `nodes` (required)
- `edges` (required)
- `progression` (required)

## 2. Coordinate Model

- Node coordinates use a 2D world plane.
- Origin `(0, 0)` is mid-continent.
- X axis: west to east (negative to positive).
- Y axis: south to north (negative to positive).

### 2.1 Anchor-Derived Placement Workflow

- `map.png` is the geometric reference for anchor selection.
- Pixel anchors are stored in `world/calibration/map_anchors.json`.
- The calibration script `scripts/calibrate-map-coords.mjs` converts pixel anchors into `nodes[*].coords` and `edges[*].waypoints` in `world/schema/world_schema_example.json`.

Deterministic conversion:

- `mapPlaneWidth = mapPlaneHeight * (imageWidth / imageHeight)`
- `sceneX = (px / imageWidth - 0.5) * mapPlaneWidth`
- `sceneZ = (py / imageHeight - 0.5) * mapPlaneHeight`
- `worldX = sceneX / SCENE_SCALE`
- `worldY = -sceneZ / SCENE_SCALE`

## 3. Global State Machine

Allowed states:

- `intro`
- `idleMap`
- `tutorial`
- `focusCharlotte`
- `exploring`
- `checkpointOpen`
- `transforming`
- `finalState`

Allowed transitions:

- `intro -> idleMap`
- `idleMap -> tutorial`
- `tutorial -> focusCharlotte`
- `focusCharlotte -> exploring`
- `exploring <-> checkpointOpen`
- `checkpointOpen -> transforming` (first completion only)
- `transforming -> exploring`
- `exploring -> finalState` (enter final node)

## 4. Interface Definitions

### 4.1 `meta`

- `worldId: string`
- `version: string`
- `title: string`
- `resumePdfUrl: string`

### 4.2 `assets`

- `mapImage: string`
- `referenceImages: Record<string, string>`
- `models?: Record<string, string>`
- `textures?: Record<string, string>`

### 4.3 `style`

- `materials.finish: "matte"`
- `materials.roundEdges: boolean`
- `materials.noPhotorealism: boolean`
- `materials.noHighFreqTextures: boolean`
- `pathStyle.baseColor: string`
- `pathStyle.highlightColor: string`
- `pathStyle.loadedColor?: string` (default `#8F8B84`)
- `pathStyle.completedColor?: string` (default `pathStyle.baseColor`)
- `pathStyle.nextColor?: string` (default `pathStyle.highlightColor`)
- `pathStyle.thickness: number`
- `pathStyle.elevation: number`
- `pathStyle.pulseOnIntro: boolean`
- `pathStyle.traceDurationMs: number`
- `pathStyle.introSweepMs?: number` (default `1800`)
- `pathStyle.stateFadeMs?: number` (default `250`)
- `nodeMarkerStyle.shape: "disc"`
- `nodeMarkerStyle.defaultScale: number`
- `nodeMarkerStyle.completedColor: string`
- `nodeMarkerStyle.hoverGlow: boolean`
- `nodeMarkerStyle.labelOnProximity: boolean`
- `fogStyle.introFogOpacity: number`
- `fogStyle.settleFogOpacity: number`
- `fogStyle.sfFogOpacity: number`
- `regionPalettes: Record<string, {primary:string, secondary:string, accent:string}>`

### 4.4 `intro`

- `enabled: boolean`
- `durationMs: number`
- `startPreset: string`
- `endPreset: string`
- `skipOnInput: boolean`
- `settleToState: "idleMap"`
- `pathTrace.enabled: boolean`
- `pathTrace.startNodeId: string`
- `pathTrace.endNodeId: string`
- `pathTrace.durationMs: number`
- `pathTrace.glowColor: string`
- `pathTrace.pulseNodes: boolean`
- `fogAnimation.startOpacity: number`
- `fogAnimation.endOpacity: number`
- `fogAnimation.easing: string`

### 4.5 `cameraPresets`

Required preset keys:

- `introStart`
- `introEnd`
- `focusCharlotte`
- `checkpointDefault`
- `finalSF`

Each preset contains:

- `position: [number, number, number]`
- `lookAt: [number, number, number]`
- `fov: number`
- `damping: number`

### 4.6 `ui`

- `startButton.label: string`
- `startButton.centered: boolean`
- `tutorial.title: string`
- `tutorial.lines: string[]`
- `tutorial.dismissOnAnyInput: boolean`
- `hud.showProgress: boolean`
- `hud.showResumeLink: boolean`
- `hud.resumeLabel: string`
- `checkpointPanel.titleSuffix: string`
- `checkpointPanel.openKey: "Enter"`
- `checkpointPanel.closeKey: "Escape"`
- `checkpointPanel.slideFrom: "right"`
- `checkpointPanel.widthPercent: number`
- `checkpointPanel.blurBackground: boolean`

### 4.7 `vehicles`

- `stages: VehicleStage[]`
- `transformRules.durationMs: number`
- `transformRules.spinDegrees: 360`
- `transformRules.swapAtPercent: number`
- `transformRules.motionBlur: boolean`
- `transformRules.dustPuff: boolean`
- `transformRules.cameraMicroZoomPercent: number`
- `stageByNodeId: Record<string, string>`

`VehicleStage` fields:

- `id: string`
- `label: string`
- `ref: string`
- `collider?: { shape: "circle", radius: number }`

### 4.8 `environment`

- `manifestRef?: string` (recommended entrypoint)
- `collision.enabled: boolean`
- `collision.playerRadius: number`
- `collision.maxSlideIterations: number`
- `buildings: Array<EnvironmentBuilding>` (inline mode)
- `props?: Array<EnvironmentObject>` (inline mode)

Split-file mode:

- `world/environments/manifest.json` (`environment_manifest.schema.json`)
- `world/environments/kits/*.json` (`environment_kit.schema.json`)
- `world/environments/regions/*.json` (`environment_region.schema.json`)

When `manifestRef` is set, runtime resolves kits + region placement data into the same effective
`buildings/props/collision` structure used by rendering and collision systems.

`EnvironmentBuilding` fields:

- `id: string`
- `position: {x:number, y:number, elevation?:number}`
- `size: {width:number, depth:number, height:number}`
- `rotation?: number` (degrees)
- `styleKey?: string`
- `collider?: boolean` (default `true`)

`EnvironmentObject` fields:

- `id: string`
- `position: {x:number, y:number, elevation?:number}`
- `size: {width:number, depth:number, height:number}`
- `rotation?: number` (degrees)
- `styleKey?: string`

2.5D collision semantics:

- Collisions are solved on the ground plane (`x/y` world space).
- Building blockers are footprint-based (width/depth with optional rotation).
- Character/vehicle visual elevation does not change collision result.
- If `vehicles.stages[*].collider.radius` is present for the active stage, it overrides
  `environment.collision.playerRadius`.
- During transforms, the effective player radius uses `max(fromStageRadius, toStageRadius)`.

### 4.9 `nodes`

Each node contains:

- `id: string`
- `name: string`
- `type: "main" | "side" | "final"`
- `region: string`
- `coords: {x:number, y:number}`
- `mapAnchorPx?: {x:number, y:number}` (authoring/calibration reference, optional)
- `radius: number`
- `marker: {label:boolean, icon:string}`
- `checkpointContentRef: string`
- `unlock: UnlockRule`
- `completion: CompletionRule`
- `landmarks?: {id:string, label:string}[]`

`UnlockRule` variants:

- `{ "type": "start" }`
- `{ "type": "after_complete", "nodeId": string }`
- `{ "type": "after_available", "nodeId": string }`

`CompletionRule` variants:

- `{ "type": "open_checkpoint_once" }`
- `{ "type": "enter_node" }`

### 4.10 `edges`

Each edge contains:

- `id: string`
- `from: string`
- `to: string`
- `type: "main" | "side"`
- `visibleWhen: VisibleRule`
- `styleKey?: string`
- `waypoints?: Array<{x:number, y:number}>`
- `renderWaypointsPx?: Array<{x:number, y:number}>` (authoring/calibration reference, optional)

`VisibleRule` variants:

- `{ "type": "always" }`
- `{ "type": "after_available", "nodeId": string }`
- `{ "type": "after_complete", "nodeId": string }`

### 4.11 `progression`

- `startNodeId: string`
- `finalNodeId: string`
- `mainSequence: string[]`
- `sideQuests: Record<string, string[]>`
- `onCompleteNode.setNodeCompletedColor: string`
- `onCompleteNode.enableNextEdgeGlow: boolean`
- `onCompleteNode.triggerTransform: boolean`
- `onEnterFinal.lockMovement: boolean`
- `onEnterFinal.increaseFog: boolean`
- `onEnterFinal.showResumeCTA: boolean`
- `onEnterFinal.showFutureLevelsText: boolean`

## 5. Invariants

- All node IDs are unique.
- All edge `from/to` IDs exist in `nodes`.
- All progression IDs exist in `nodes`.
- `startNodeId` equals first `mainSequence` node.
- `finalNodeId` equals last `mainSequence` node.
- Every node has a `checkpointContentRef` under `/content/checkpoints/`.
- `intro.startPreset` and `intro.endPreset` are valid `cameraPresets` keys.
- `vehicles.stageByNodeId` values reference valid `vehicles.stages[*].id`.
- Environment object IDs are unique per collection (`buildings`, `props`).
- Environment footprint sizes are strictly positive.
- Environment positions stay within authored world bounds for reachable gameplay.
- In manifest mode, all `kitRefs` and `regionRefs` resolve to schema-valid files.
