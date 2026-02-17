import type { RuntimeWorldStore } from "../types/world";

export function resolveQualityTier(): RuntimeWorldStore["qualityTier"] {
  // Simple scaffold heuristic. Lovable can replace with real device probing.
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof memory === "number" && memory <= 4) {
    return "low";
  }

  if (typeof memory === "number" && memory <= 8) {
    return "medium";
  }

  return "high";
}
