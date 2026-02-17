# Lovable Handoff: Overworld Scaffold

This repository now includes a React + Vite + TypeScript scaffold aligned to the canonical contracts in `world/`.

## What is implemented

- Runtime boot pipeline:
  - `src/bootstrap/initWorld.ts`
  - `src/bootstrap/validateWorldConfig.ts` (Ajv-backed JSON Schema validation + cross-reference checks)
  - `src/bootstrap/checkAssets.ts`
- Data loaders:
  - `src/data/loadWorldConfig.ts`
  - `src/data/loadCheckpointContent.ts` (YAML frontmatter parsing + strict contract validation)
- Domain logic:
  - `src/domain/progressionEngine.ts` (merged progression + graph queries)
  - `src/domain/stageResolver.ts`
- State machine/store:
  - `src/state/worldMachine.ts`
  - `src/state/worldStore.ts`
  - `src/state/selectors.ts`
- Input/action routing:
  - `src/input/keyboardController.ts`
  - `src/input/proximityDetector.ts`
  - `src/input/actionRouter.ts`
- Scene/UI/camera/animation/postFX scaffolds:
  - `src/scene/*`
  - `src/ui/*`
  - `src/camera/*`
  - `src/animation/*`
  - `src/postfx/*`
- Test entry points:
  - `src/test/unit/*`
  - `src/test/integration/*`
  - `src/test/e2e/*`

## Required reference directories kept

- `assets/` (runtime required assets)
- `vehicles/` (reference-only placeholder)
- `world/` (canonical contracts)
- `content/checkpoints/` (checkpoint markdown content)

## Vehicles Folder Policy

- `vehicles/` being empty is currently acceptable.
- It is intentionally reserved for optional local vehicle assets/notes.
- Runtime vehicle behavior must still be driven by:
  - `world/vehicles/vehicles_spec.md`
  - `world/schema/world_schema_example.json` (`vehicles.stages`, `vehicles.stageByNodeId`, `vehicles.transformRules`)
- If Lovable adds runtime models later, they must be documented in `world/assets/assets_manifest.md` and wired through schema paths.

## What remains for Lovable

- Replace placeholder scene blocks with real isometric 3D implementation.
- Implement true camera interpolation, follow math, and render pipeline integration.
- Wire production transform visuals, intro path tracing, and postprocessing.
- Expand tests to full acceptance coverage in `world/qa/acceptance_test_plan.md`.
- Performance-tune to 60 FPS median desktop target.

## Lovable TODO Checklist (Strict, Acceptance-Gated)

### Phase 1: Contracts and boot integrity (must pass before rendering work)

- [ ] Keep `world/` contracts unchanged as source of truth.
- [ ] Validate world config against schema at startup.
- [ ] Enforce cross-reference invariants (node IDs, edge endpoints, stage mappings, checkpoint refs).
- [ ] Fail fast with actionable errors for missing required assets.
- [ ] Keep checkpoint content contract strict (frontmatter keys and highlight bounds).

### Phase 2: Core world runtime (must pass before cinematic polish)

- [ ] Implement full FSM transitions exactly as documented:
  - `intro -> idleMap -> tutorial -> focusCharlotte -> exploring`
  - `exploring <-> checkpointOpen`
  - `checkpointOpen -> transforming -> exploring`
  - `exploring -> finalState`
- [ ] Implement merged progression engine behavior (availability, neighbors, edge visibility).
- [ ] Ensure side quest availability does not gate main sequence progression.
- [ ] Enforce movement lock in `checkpointOpen`, `transforming`, `finalState`.

### Phase 3: Camera, intro, and transform choreography

- [ ] Replace camera debug scaffold with interpolation-based controller (no snaps).
- [ ] Implement intro timeline timings and deterministic skip settle.
- [ ] Implement exploration lead-follow without rotation drift.
- [ ] Implement transform choreography timing:
  - duration from schema
  - 360 spin
  - geometry swap at `swapAtPercent`
  - landing effect
  - camera micro-zoom
- [ ] Ensure motion blur only during transform mid-spin.

### Phase 4: UI integration and accessibility

- [ ] Implement integrated checkpoint panel (not full-screen takeover).
- [ ] Render markdown content from `checkpointContentRef`.
- [ ] Trap focus while panel is open; Escape closes from any focused child.
- [ ] Respect reduced-motion preferences.
- [ ] Keep left-side world context visible while panel is open.

### Phase 5: QA and performance sign-off (release gate)

- [ ] Pass unit + integration + e2e journey tests.
- [ ] Add acceptance tests matching `world/qa/acceptance_test_plan.md`.
- [ ] Verify no scene remount on checkpoint open/close.
- [ ] Verify no hard camera cuts on any transition.
- [ ] Hit desktop target: 60 FPS median during exploration.
- [ ] Add low-end effect fallback behavior.

## Definition of Done for Lovable

- [ ] All contracts in `world/` are satisfied with no behavior deviations.
- [ ] All required directories remain present: `assets/`, `vehicles/`, `world/`, `content/checkpoints/`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:unit`, `pnpm test:integration`, and journey e2e suite pass.
- [ ] Final state behavior matches schema flags (`lockMovement`, `increaseFog`, `showResumeCTA`, `showFutureLevelsText`).

## Run commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test:unit
```

## Source of truth

All behavior and constraints must remain aligned with:

- `world/README.md`
- `world/schema/world_schema.md`
- `world/schema/world_config.schema.json`
- `world/qa/acceptance_test_plan.md`
