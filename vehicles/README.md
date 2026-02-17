# vehicles/

This directory is intentionally empty for now.

Purpose:

- Reserved for optional vehicle-local reference files or runtime model assets.
- Current vehicle behavior contracts are defined in:
  - `world/vehicles/vehicles_spec.md`
  - `world/schema/world_schema_example.json` (`vehicles` section)

If files are added here later:

- Keep naming stable and lowercase.
- Document new runtime assets in `world/assets/assets_manifest.md`.
- Wire paths through world schema/config instead of hardcoding.
