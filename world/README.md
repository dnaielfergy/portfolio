# World Documentation Index

This folder is the canonical implementation contract for the portfolio world.

## Build Order for Loveable

1. Validate and load `world/schema/world_schema_example.json` against `world/schema/world_config.schema.json`.
2. Implement world state machine and progression from `world/schema/world_schema.md`.
3. Implement camera behavior from `world/camera/camera_spec.md`.
4. Implement checkpoint UI from `world/ui/checkpoint_ui_spec.md`.
5. Implement character/vehicle stages and transforms from `world/vehicles/vehicles_spec.md`.
6. Implement intro cinematic from `world/intro/intro_spec.md`.
7. Validate all required assets using `world/assets/assets_manifest.md`.
8. Run end-to-end acceptance checks in `world/qa/acceptance_test_plan.md`.
9. Resolve environment manifests (`world/environments/manifest.json`) into runtime buildings/colliders.

## Non-Negotiables

- Data-driven world config. No hardcoded node graph.
- Stable isometric framing during exploration.
- No camera snaps.
- Matte low-poly visual style.
- Checkpoint UI integrated with world view (not full-screen modal takeover).
- Resume content is loaded via `checkpointContentRef` markdown files.

## Resume Content Placeholder Boundary

The only placeholders allowed at this stage are the node-specific resume details in:

- `content/checkpoints/*.md`

All behavior, structure, timing, contracts, and acceptance criteria in `world/` are final.
