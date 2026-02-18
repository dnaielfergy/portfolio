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
  if (assets.identityIssues.length > 0) {
    const message = `World asset identity check failed: ${assets.identityIssues.join("; ")}`;
    if (import.meta.env.VITE_FAIL_ON_DUPLICATE_BASE_MAP === "true") {
      throw new Error(message);
    }
    console.warn(message);
  }

  return {
    world: normalizeWorldConfig(config),
  };
}
