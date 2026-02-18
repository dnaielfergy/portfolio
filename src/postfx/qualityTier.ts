import type { RuntimeWorldStore } from "../types/world";

export function resolveQualityTier(): RuntimeWorldStore["qualityTier"] {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency ?? 8;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    return "low";
  }

  if ((typeof memory === "number" && memory <= 4) || hardwareConcurrency <= 4) {
    return "low";
  }

  if ((typeof memory === "number" && memory <= 8) || hardwareConcurrency <= 8) {
    return "medium";
  }

  return "high";
}
