# Cinematic Intro Specification

Total Duration: 3.0 seconds

Style: intentional, restrained, premium.

This specification is intentionally lift-and-shift from `intro.md` with minimal normalization for schema binding and testability.

## Path Trace System

The golden road is initially dim.

A soft traveling light trace animates along it:

- origin: San Francisco
- destination: Charlotte
- duration: ~1.8 seconds
- warm gold highlight
- slight bloom glow
- 2% to 3% intensity pulse
- leaves subtle illuminated trail behind (not neon)

It should feel like a memory being replayed, not an arcade unlock animation.

## Full Cinematic Sequence

### 0.0s - Open on Pacific

- Camera positioned west of San Francisco.
- Golden Gate bridge partially in frame.
- Fog rolling softly.
- Path faint.
- Ocean calm.
- Light trace begins at SF.

### 0.3s-1.5s - Path Travels East

Camera begins smooth lateral glide.

- slight downward angle
- subtle parallax
- light travels along road
- as it passes cities, those nodes gently brighten for ~200ms
- no hard glow

The camera is following the trace, but not locked to it.

### 1.5s-2.4s - Southeast Approach

Light reaches Huntsville, Atlanta, then Charlotte.

When it reaches Charlotte:

- Charlotte node softly pulses
- path glow fades to normal

### 2.4s-3.0s - Settle

Camera eases into full map frame.

- slight zoom out
- fog decreases
- vignette increases
- motion stops

Then start CTA fades in:

`[ START JOURNEY ]`

## Camera Tech Rules

Movement:

- bezier-like path
- ease-in-out cubic
- slight vertical drift (+/- 1 to 2 world units)

Depth of field:

- slightly blurred during motion
- sharpens as camera settles

Fog:

- 15% opacity at start
- 8% opacity at settle

No snap cuts.
No speed spikes.

## Interaction After Intro

If user presses any key during cinematic:

- skip animation
- immediately settle to final frame
- show Start button

User should never be forced to watch.

## Schema Binding Table

| Behavior | Schema Key |
|---|---|
| Intro enabled | `intro.enabled` |
| Intro total duration | `intro.durationMs` |
| Intro start camera preset | `intro.startPreset` |
| Intro end camera preset | `intro.endPreset` |
| Skip on input | `intro.skipOnInput` |
| Settle state | `intro.settleToState` |
| Path trace enabled | `intro.pathTrace.enabled` |
| Trace start node | `intro.pathTrace.startNodeId` |
| Trace end node | `intro.pathTrace.endNodeId` |
| Trace duration | `intro.pathTrace.durationMs` |
| Trace glow color | `intro.pathTrace.glowColor` |
| Node pulse behavior | `intro.pathTrace.pulseNodes` |
| Fog start opacity | `intro.fogAnimation.startOpacity` |
| Fog end opacity | `intro.fogAnimation.endOpacity` |
| Fog easing | `intro.fogAnimation.easing` |

## State Transition Contract

- Entry state: `intro`
- Successful completion transition: `intro -> idleMap`
- Skip transition on input: `intro -> idleMap` (fast settle, no cut)
- Post-intro CTA visibility is part of `idleMap` rendering

## Acceptance Tests

1. Intro starts at `introStart` camera preset and ends at `introEnd` within configured duration.
2. Path trace begins at SF node and reaches Charlotte within `intro.pathTrace.durationMs` window.
3. Fog transitions from `startOpacity` to `endOpacity` over intro duration.
4. Any user input during intro triggers deterministic settle into idle map view.
5. No hard camera cuts or abrupt velocity spikes occur.
6. Start button appears only after settle to `idleMap`.
