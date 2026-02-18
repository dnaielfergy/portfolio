# World Refactor Execution Plan

## Milestones

- [ ] 1. Scale Foundation
  - [ x] Update core scene scale constant in `src/data/loadWorldConfig.ts` (`SCENE_SCALE`).
  - [ x] Re-tune movement speed in `src/App.tsx` (`const speed = ...`) to preserve feel.
  - [ x] Re-tune collision radius in `world/environments/manifest.json` (`collision.playerRadius`).
  - [x ] Re-check camera offsets/presets in `world/schema/world_schema_example.json` (`cameraPresets`).
  - [ x] Validate with: `pnpm typecheck`, `pnpm test:unit`, quick manual run (`pnpm dev`).

- [ ] 2. Lock Spatial Layout (Cities, Nodes, Labels)
  - [ ] Reposition nodes in `world/schema/world_schema_example.json` (`nodes[*].coords`).
  - [ ] Update city/building placement in `world/environments/regions/*.json`.
  - [ ] Adjust key label offsets in `src/data/loadWorldConfig.ts` (`KEY_NODE_LABELS`).
  - [ ] Verify proximity/open radius works at each node (`nodes[*].radius` in world config).
  - [ ] Validate with: `pnpm test:unit` (especially map anchors + proximity) and manual scene check.

- [ ] 3. City Graybox + Collision Pass
  - [ ] For each region file in `world/environments/regions/*.json`, create gameplay-first building footprints.
  - [ ] Use reusable kit modules in `world/environments/kits/us_city_kit.json`; add modules only when necessary.
  - [ ] Keep blockers in `buildings`; use decorative objects in `props`.
  - [ ] Confirm collider behavior with `src/test/unit/collision.test.ts` and manual movement around each city.
  - [ ] Validate with: `pnpm test:unit`, `pnpm test:e2e`.

- [ ] 4. Path Realignment
  - [ ] Redraw edge waypoints in `world/schema/world_schema_example.json` (`edges[*].waypoints`).
  - [ ] Ensure path elevation/render still reads clean in `src/scene/PathLayer.tsx`.
  - [ ] Re-check intro path trace route assumptions in `src/scene/edgeVisualState.ts`.
  - [ ] Validate with: `pnpm test:unit` (`edgeVisualState`, anchors), manual intro + exploring pass.

- [ ] 5. Player Model Refinement
  - [ ] Update geometry/material styling in `src/scene/CharacterRig.tsx`.
  - [ ] Rebalance player visual size vs node markers and building scale.
  - [ ] Verify rotation and bob animation still look correct at new scale.
  - [ ] Validate with manual passes in exploring/checkpoint/transform states.

- [ ] 6. Vehicle Model Refinement
  - [ ] Update per-vehicle meshes in `src/scene/vehicles/*.tsx`.
  - [ ] Keep transform choreography compatibility with `src/scene/VehicleRig.tsx`.
  - [ ] Ensure occlusion remains correct with buildings (no forced top-layer behavior reintroduced).
  - [ ] Validate with: manual transform checks + `pnpm test:e2e`.

- [ ] 7. Final QA + Performance Gate
  - [ ] Run full checks: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`.
  - [ ] Manual perf sanity on desktop and mobile-emulated viewport:
    - [ ] target desktop near 60 FPS
    - [ ] target mid-mobile near 30 FPS
  - [ ] If needed, reduce density via `world/environments/regions/*.json` and simplify kit modules.

## Definition Of Done

- [ ] All cities navigable with no collision dead-ends.
- [ ] Node interactions (`Enter`, checkpoint open/close) remain stable.
- [ ] Paths visually align with city layout.
- [ ] Player and vehicles are proportionate and properly occluded.
- [ ] Full test/build pipeline passes.

## Notes

- Keep this document current as milestones progress.
- Prefer checking off individual subtasks as they complete.
