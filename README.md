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
