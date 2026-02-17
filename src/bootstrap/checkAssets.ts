import type { WorldConfig } from "../types/world";

export interface AssetCheckResult {
  missing: string[];
  checked: string[];
}

async function pathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkRequiredAssets(config: WorldConfig): Promise<AssetCheckResult> {
  const requiredPaths = [config.assets.mapImage, ...Object.values(config.assets.referenceImages)];

  const missing: string[] = [];
  for (const path of requiredPaths) {
    const exists = await pathExists(path);
    if (!exists) {
      missing.push(path);
    }
  }

  return {
    missing,
    checked: requiredPaths,
  };
}
