# Edit world scale

**World Scale (Current Setup)**
- Global render scale is `SCENE_SCALE = 2.5` in `src/data/loadWorldConfig.ts:30`.
- World -> scene conversion is in `src/data/loadWorldConfig.ts:242`:
  - `scene.x = worldX * 2.5`
  - `scene.z = -worldY * 2.5` (note the sign flip)
  - `scene.y = elevation` (passed in directly)
- Map plane size is fixed to height `240` scene units in `src/scene/MapLayer.tsx:6`; width is `240 * imageAspect` in `src/scene/MapLayer.tsx:24`.
- With current anchor metadata (`1376x768`), map width is `430` scene units (`world/calibration/map_anchors.json:3`).
- So effectively: `1 world unit = 2.5 scene units`, and the map covers about `172 x 96` world units.

**How City Nodes Are Mapped**
- Runtime source of truth is `nodes[*].coords` in `world/schema/world_schema_example.json:314`.
- Those coords are anchor-derived (pixel anchors in `world/calibration/map_anchors.json:8`) using the documented conversion in `world/schema/world_schema.md:36` and mirrored in test code `src/test/unit/mapAnchors.test.ts:13`.
- At load time, each node is normalized into:
  - `worldPosition` (original coords)
  - `scenePosition` via `toSceneCoords(..., elevation=0.05)` in `src/data/loadWorldConfig.ts:269`.
- Node visuals use `scenePosition` in `src/scene/NodeMarkers.tsx:47`.
- Interaction/proximity uses world-space coords + radius (not scene-space marker size) in `src/input/proximityDetector.ts:3`.
- Player starts exactly at configured start node coords in `src/state/worldStore.ts:51`.

**Current City Node Placements**
- `charlotte`: world `(47.75, -5.75)` -> scene `(119.375, 0.05, 14.375)` (`world/schema/world_schema_example.json:300`)
- `georgia_tech`: world `(39, -13.25)` -> scene `(97.5, 0.05, 33.125)` (`world/schema/world_schema_example.json:318`)
- `aquarium`: world `(43, -14.5)` -> scene `(107.5, 0.05, 36.25)` (`world/schema/world_schema_example.json:347`)
- `huntsville_parsons`: world `(22.875, -9.625)` -> scene `(57.188, 0.05, 24.063)` (`world/schema/world_schema_example.json:370`)
- `palo_alto_wisk`: world `(-57.875, 1.5)` -> scene `(-144.688, 0.05, -3.75)` (`world/schema/world_schema_example.json:393`)
- `san_diego_fictiv`: world `(-52, -12)` -> scene `(-130, 0.05, 30)` (`world/schema/world_schema_example.json:416`)
- `san_francisco`: world `(-62.25, 6.25)` -> scene `(-155.625, 0.05, -15.625)` (`world/schema/world_schema_example.json:439`)

**One more scale coupling to know**
- Fog distances are scaled by `SCENE_SCALE` too (`src/postfx/PostFXManager.tsx:17`), so changing scale affects both geometry placement and fog depth behavior.

# Edit Camera Zoom

 For a **true “camera zoom” effect**, change camera presets, not `SCENE_SCALE`.

- Edit `world/schema/world_schema_example.json` under `cameraPresets`.
- The main gameplay camera uses `checkpointDefault` because of `src/camera/cameraController.ts:107`.
- Zoom behavior:
  - Zoom **out**: increase `position[1]` and `position[2]`, or increase `fov`.
  - Zoom **in**: decrease `position[1]` and `position[2]`, or decrease `fov`.

Example (exploring zoom out):
- `checkpointDefault.position`: from `[0, 64, 96]` to something like `[0, 78, 120]`
- optionally `fov`: `42 -> 46`

Important: changing `SCENE_SCALE` in `src/data/loadWorldConfig.ts:30` is a **world rescale**, not just camera zoom. It affects node/environment placement and fog scaling (`src/postfx/PostFXManager.tsx:17`) and can de-align map anchoring unless you recalibrate coords.

# Edit player speed

For movement speed, edit these constants in `src/App.tsx`:

- `PLAYER_BASE_SPEED` (`src/App.tsx:31`): normal movement speed.
- `PLAYER_MAX_SPEED` (`src/App.tsx:32`): top speed after holding input.
- `PLAYER_BOOST_DELAY_SECONDS` (`src/App.tsx:33`): how long before acceleration kicks in.
- `PLAYER_BOOST_ACCEL` (`src/App.tsx:34`): how fast it ramps to max.
- `PLAYER_STOP_DECEL` (`src/App.tsx:35`): braking when you release input.

Quick tuning:
- Faster overall: raise `PLAYER_BASE_SPEED` and `PLAYER_MAX_SPEED`.
- Faster ramp-up: lower `PLAYER_BOOST_DELAY_SECONDS`, raise `PLAYER_BOOST_ACCEL`.
- More slippery vs snappy stop: lower vs raise `PLAYER_STOP_DECEL`.

If you meant animation/transition speed instead:
- Transform speed: `vehicles.transformRules.durationMs` in `world/schema/world_schema_example.json`.
- Intro camera/path timing: `intro.durationMs` and `intro.pathTrace.durationMs` in `world/schema/world_schema_example.json`.

# Edit map image
Map floor rendering is currently this:

- The floor is a textured plane in `src/scene/MapLayer.tsx:13` using `config.assets.mapImage`.
- Your world config currently points to `/assets/map.png` in `world/schema/world_schema_example.json:9`.
- Routes are also drawn at runtime as 3D line overlays in `src/scene/PathLayer.tsx:347` and `src/scene/PathLayer.tsx:369`.
- Node labels are runtime HTML overlays in `src/scene/NodeMarkers.tsx:159`, not painted onto geometry.

So yes: if you now see lines/labels on the map floor, that means they’re baked into `/assets/map.png` again. You’re also seeing runtime path/label layers on top, which can look duplicated.

To fix, switch base map to a clean texture, usually:
- `config.assets.mapImage = "/assets/map_without_line.png"` in `world/schema/world_schema_example.json:9`

# Edit Vehicle/Character Size

There are 2 separate “sizes” to tune:

1. **Physical size (collision/hitbox)**
- Per vehicle stage: edit `vehicles.stages[*].collider.radius` in `world/schema/world_schema_example.json:215`.
- Global fallback radius: edit `collision.playerRadius` in `world/environments/manifest.json:3` (used when a stage has no collider).
- Resolution logic is in `src/physics/vehicleCollider.ts:24`:
  - normal: active stage radius
  - transforming: `max(fromStage, toStage)` radius

2. **Visual model size (what you see)**
- Vehicle meshes are hardcoded in stage components:
  - `src/scene/vehicles/WreckStage.tsx:5`
  - `src/scene/vehicles/ParsonsStage.tsx:5`
  - `src/scene/vehicles/WiskStage.tsx:19`
  - `src/scene/vehicles/FictivStage.tsx:5`
  - `src/scene/vehicles/WhaleStage.tsx:9`
- Runner stage currently renders no vehicle mesh (`src/scene/vehicles/RunnerStage.tsx:1`), so “player body” visuals come from `src/scene/CharacterRig.tsx:35`.

Important:
- Changing collider radius changes gameplay collision and clearance.
- Changing geometry args/mesh scale changes only visuals unless you also update collider radius.