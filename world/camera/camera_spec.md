# Camera Behavior Specification

This is the canonical camera contract for the overworld.

## 1. Camera States

```ts
type CameraState =
  | "intro"
  | "idleMap"
  | "tutorial"
  | "focusCharlotte"
  | "exploring"
  | "checkpointOpen"
  | "transforming"
  | "finalState";
```

## 2. Global Rules

- Never hard-set camera position.
- Always interpolate position and zoom.
- Use damping/lerp for position and slerp for rotation.
- During exploration, keep a stable isometric framing.
- Disable heavy post-processing while moving on low-end devices.

## 3. Preset Dependencies

Camera reads `cameraPresets` from `world/schema/world_schema_example.json`:

- `introStart`
- `introEnd`
- `focusCharlotte`
- `checkpointDefault`
- `finalSF`

## 4. State Contracts

### 4.1 Intro

- Duration: 3000ms.
- Move from `introStart` to `introEnd` on eased bezier-like path.
- Path trace progression must sync to `intro.pathTrace.durationMs`.
- Input skip: settle to `introEnd` within 300ms.

### 4.2 Idle Map

- Static full-map framing with very subtle drift.
- Drift amplitude stays minimal and does not affect readability.

### 4.3 Focus Charlotte

- Triggered after tutorial dismissal.
- Duration: 1200ms.
- Interpolate to `focusCharlotte` preset.

### 4.4 Exploring

- Lead-follow behavior:
  - camera target = character position + velocity-normalized lead vector.
- Recommended lead distance: 10% to 15% of viewport world width.
- If character speed is near zero, recenters softly over ~800ms.
- Do not rotate camera based on movement direction.

### 4.5 Checkpoint Open

- Freeze follow.
- Apply 5% to 8% zoom-in.
- Slight upward offset to keep character and vehicle in left side view.
- Increase depth-of-field blur on background only.

### 4.6 Transforming

- Freeze follow.
- Apply micro-zoom from schema (`vehicles.transformRules.cameraMicroZoomPercent`).
- Keep orientation fixed while transform occurs.
- Return to exploration zoom via eased interpolation.

### 4.7 Final State

- Move to `finalSF` preset.
- Lock camera movement.
- Increase fog density.
- Keep static hero frame for terminal CTA state.

## 5. Failure Guards

Reject behavior that causes:

- camera snapping
- oscillation or over-correction
- unexpected rotation drift
- abrupt FOV changes

## 6. Acceptance

- No state transition introduces a hard cut.
- Skip intro always settles deterministically.
- Checkpoint entry and exit maintain continuity with exploration framing.
