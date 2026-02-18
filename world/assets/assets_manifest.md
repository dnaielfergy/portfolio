# Assets Manifest

Required local assets:

- `/assets/map_without_line.png`
- `/assets/charlotte.png`
- `/assets/georgia_tech.png`
- `/assets/aquarium.png`
- `/assets/parsons.png`
- `/assets/wisk.png`
- `/assets/fictiv.png`

Reference-only style assets:

- `/assets/map_without_labels.png` (style target, not runtime required)

Legacy fallback assets:

- `/assets/map.png` (temporary comparison fallback)

Integrity guardrail:

- `map_without_line.png` must not be byte-identical to `map.png`.
- Set `VITE_FAIL_ON_DUPLICATE_BASE_MAP=true` to fail fast on duplicate base map content.

## Usage Constraints

- Assets are local and versioned in repository.
- No external CDN dependency for core scene visuals.
- Models and textures are optional extensions and must remain compatible with matte low-poly style.
- Any new asset must be documented here before use.

## Naming Rules

- lowercase
- snake_case or simple lowercase filename
- stable references from world schema

## Fallback Policy

- If optional asset is missing, render a simplified geometry fallback.
- If required asset is missing, fail fast with a clear startup error listing missing paths.
