import { checkRequiredAssets } from "./checkAssets";
import { validateWorldConfig } from "./validateWorldConfig";
import { loadWorldConfig, normalizeWorldConfig } from "../data/loadWorldConfig";

export interface InitWorldResult {
  world: ReturnType<typeof normalizeWorldConfig>;
}

export async function initWorld(): Promise<InitWorldResult> {
  const config = await loadWorldConfig();

  validateWorldConfig(config);

  const assets = await checkRequiredAssets(config);
  if (assets.missing.length > 0) {
    throw new Error(
      `Missing required world assets: ${assets.missing.join(", ")}. See world/assets/assets_manifest.md`,
    );
  }

  return {
    world: normalizeWorldConfig(config),
  };
}
