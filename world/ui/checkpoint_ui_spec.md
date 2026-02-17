# Checkpoint UI Specification

This document defines the checkpoint panel system and world/UI interaction contract.

## 1. Goal

Checkpoint UI must feel integrated with the world. It is not a full-screen modal replacement for gameplay.

## 2. Activation

- Open key: `Enter` when player is within node radius.
- Close key: `Escape`.
- Optional click open: node marker.
- On open:
  - state changes to `checkpointOpen`
  - camera applies checkpoint framing
  - movement input is disabled

## 3. Layout

- Left zone (40% to 50%): live world view (character + vehicle visible).
- Right zone (50% to 60%): checkpoint panel.
- Panel style:
  - frosted glass effect
  - rounded corners (12px to 16px)
  - subtle shadow
  - 85% to 90% opacity

## 4. Panel Content Model

Panel renders content loaded from `checkpointContentRef` markdown file.

Required display fields:

- title
- subtitle
- 3 to 6 highlights

Optional fields:

- media
- CTA

## 5. Motion

- Entry: slide in from right, 300ms, cubic-out, opacity 0 to 1.
- Exit: slide out right, 250ms, cubic-in.
- Camera returns to exploration framing only after panel exit completes.

## 6. Completion Behavior

On first close only:

- mark node completed
- set marker color to `style.nodeMarkerStyle.completedColor`
- show subtle completion check
- enable next edge glow per progression config
- trigger vehicle transform if enabled

## 7. Accessibility

- Focus moves into panel on open.
- Focus trap remains inside panel until close.
- Escape closes panel from any focused element.
- Keyboard open/close hints available in tutorial/HUD.
- Respect reduced motion preference by shortening or disabling non-essential animation.

## 8. Performance

Checkpoint open/close must not:

- reload scene
- recreate map geometry
- reset camera controller

Allowed updates:

- UI layer toggle
- camera state transition
- selective post-process blur adjustments

## 9. Final Node Behavior

At final checkpoint:

- movement remains locked
- panel includes future levels text and resume/contact actions
- camera remains in final hero framing
