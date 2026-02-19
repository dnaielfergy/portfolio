# Interactive Isometric Resume Overworld

This repository contains the implementation contracts for an interactive portfolio experience: a guided journey across a stylized U.S. map where each checkpoint represents a career or life milestone.

The docs are organized for direct Loveable handoff. The only placeholders intentionally left incomplete are per-checkpoint resume content details.

## Canonical Documentation

Start here:

- `world/README.md` - master index and build order

Authoritative contracts:

- `world/schema/world_schema.md`
- `world/schema/world_schema_example.json`
- `world/schema/world_config.schema.json`
- `world/schema/environment_manifest.schema.json`
- `world/schema/environment_kit.schema.json`
- `world/schema/environment_region.schema.json`
- `world/schema/checkpoint_content_schema.md`
- `world/camera/camera_spec.md`
- `world/ui/checkpoint_ui_spec.md`
- `world/vehicles/vehicles_spec.md`
- `world/intro/intro_spec.md`
- `world/assets/assets_manifest.md`
- `world/qa/acceptance_test_plan.md`

Content placeholders:

- `content/checkpoints/*.md`

The canonical source of truth for implementation is the `world/` tree.

## Scaffold Status

A React + Vite + TypeScript scaffolding package has been added under `src/` to map directly to the world contracts.

Handoff summary:

- `LOVABLE_HANDOFF.md`

Primary runtime entrypoints:

- `src/App.tsx`
- `src/bootstrap/initWorld.ts`
- `src/domain/progressionEngine.ts`
- `src/state/worldMachine.ts`

## Environment Authoring Guide

The environment system supports two modes:

- Recommended: `environment.manifestRef` in `world/schema/world_schema_example.json`
- Backward compatible: inline `environment.buildings/collision` in world config

For scalable city/world authoring, use the manifest split:

1. Define reusable building modules in `world/environments/kits/*.json`.
2. Place those modules per region in `world/environments/regions/*.json`.
3. Reference kits and regions from `world/environments/manifest.json`.
4. Point world config to the manifest via `environment.manifestRef`.

### File Responsibilities

- `world/environments/manifest.json`
  - global collision defaults (`enabled`, `playerRadius`, `maxSlideIterations`)
  - `kitRefs`
  - `regionRefs`
- `world/environments/kits/*.json`
  - reusable module templates (`id`, `size`, `styleKey`, `colliderByDefault`)
  - optional `modelRef` for future custom meshes
- `world/environments/regions/*.json`
  - concrete placed instances (`id`, `moduleId`, `position`, `rotation`)
  - optional per-instance overrides (`size`, `styleKey`, `collider`)
  - optional `props` for non-colliding scenery

### Authoring Rules

- Keep collision simple: footprint-based blockers in `buildings`.
- Keep visuals and collision decoupled: use `props` for decorative objects.
- Reuse modules heavily to keep draw calls and content maintenance low.
- Use unique IDs across all placed objects.

### Add A New City

1. Add or reuse kit modules in `world/environments/kits/us_city_kit.json`.
2. Create a new region file in `world/environments/regions/<city>.json`.
3. Add the new region path to `world/environments/manifest.json`.
4. Run validation and tests:
   - `pnpm typecheck`
   - `pnpm test:unit`
   - `pnpm test:integration`

### Runtime Resolution

At load time, runtime resolves:

- `manifest` + `kits` + `regions` -> normalized `environment.buildings/props/collision`

This resolution happens in `src/data/loadWorldConfig.ts`, and resulting collisions are used by `src/physics/collision.ts`.

## Dev Calibration Panels

In `dev` mode, calibration panels are enabled unless `VITE_ENABLE_CAMERA_CALIBRATION` is explicitly set to `false`, `0`, or `off`.

- `Camera & Scale Calibration`: tune candidate camera presets/scale, then copy JSON for schema.
- `Node Position Calibration`: drag a standalone test marker, fine-tune X/Y, and copy `{ "x": ..., "y": ... }` for `nodes[*].coords`.

### Collision Tuning Baseline

- Baseline global collider radius is `0.85` in `world/environments/manifest.json`.
- Atlanta isolation harness for re-tuning:
  - `world/environments/manifest.atlanta_tuning.json`
  - `world/environments/regions/atlanta_tuning.json`
- Radius sweep coverage is codified in `src/test/unit/collisionRadiusSweep.test.ts` using:
  - `0.65`, `0.75`, `0.85`, `0.95`, `1.05`
- Recommended tuning loop:
  1. Temporarily set `world/schema/world_schema_example.json` `environment.manifestRef` to `"/world/environments/manifest.atlanta_tuning.json"`.
  2. Tune `collision.playerRadius` and run `pnpm test:unit`.
  3. Switch `manifestRef` back to `"/world/environments/manifest.json"` and re-run progression checks.
