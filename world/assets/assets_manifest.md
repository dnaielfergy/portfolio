# Assets Manifest

Required local assets:

- `/assets/map.png`
- `/assets/charlotte.png`
- `/assets/georgia_tech.png`
- `/assets/aquarium.png`
- `/assets/parsons.png`
- `/assets/wisk.png`
- `/assets/fictiv.png`

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
