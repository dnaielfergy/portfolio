import type { WorldConfig } from "../types/world";

export interface AssetCheckResult {
  missing: string[];
  checked: string[];
  identityIssues: string[];
}

async function pathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function fileHash(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
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

  const identityIssues: string[] = [];
  const legacyMapPath = "/assets/map.png";
  if (config.assets.mapImage !== legacyMapPath) {
    const [baseHash, legacyHash] = await Promise.all([
      fileHash(config.assets.mapImage),
      fileHash(legacyMapPath),
    ]);

    if (baseHash && legacyHash && baseHash === legacyHash) {
      identityIssues.push(
        `Configured base map '${config.assets.mapImage}' is byte-identical to legacy '${legacyMapPath}'. Replace it with a clean map that has no baked route or labels.`,
      );
    }
  }

  return {
    missing,
    checked: requiredPaths,
    identityIssues,
  };
}
