# Acceptance Test Plan

This plan validates that Loveable's implementation matches documentation contracts.

## 1. Config Validation

- Validate `world/schema/world_schema_example.json` against `world/schema/world_config.schema.json`.
- Fail if required fields or enums are violated.

## 2. Cross-Reference Integrity

- Every node ID is unique.
- Every edge endpoint exists in nodes.
- `progression.mainSequence` IDs exist and are ordered from start to final.
- Every `checkpointContentRef` file exists.
- Every `vehicles.stageByNodeId` value exists in `vehicles.stages`.

## 3. Intro and Camera

- Intro duration and trace duration match config.
- Intro skip on input settles to `idleMap` deterministically.
- No hard camera cuts through all state transitions.
- Exploration maintains stable isometric orientation.

## 4. Progression and Gameplay

- Start at Charlotte.
- Main path unlock sequence works in order.
- Aquarium side node unlocks without blocking main sequence.
- Completing checkpoint updates node visual and next path state.

## 5. Checkpoint UI

- Enter opens panel only when inside node radius.
- Escape closes panel and restores exploration controls.
- First close triggers completion effects exactly once.
- Panel remains readable on desktop and mobile viewport sizes.
- Keyboard focus is trapped in panel while open.

## 6. Vehicle Transform

- Transform triggers after first completion where configured.
- Choreography follows spin/swap/landing timing.
- Camera micro-zoom applies and returns smoothly.

## 7. Final State

- Entering final node locks movement.
- Final panel shows resume CTA and future levels text.
- Camera remains in final hero framing.

## 8. Placeholder Boundary

- Only node resume content fields in `content/checkpoints/*.md` remain placeholders.
- No placeholders remain in behavior/spec/schema docs under `world/`.
