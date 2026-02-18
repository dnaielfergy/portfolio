# TODO

- Rename runtime world config usage so `world/schema/world_schema_example.json` is example-only:
  - create a runtime config file (for example `world/config/world.json`)
  - point `DEFAULT_WORLD_CONFIG_PATH` in `src/data/loadWorldConfig.ts` to runtime config
  - keep `world_schema_example.json` as documentation/sample data
  - update tests/imports that currently treat the example file as canonical runtime config
