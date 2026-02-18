import type { IntroConfig } from "../types/world";

export interface IntroTimeline {
  play: (onProgress?: (progress: number) => void) => Promise<void>;
  skip: (onProgress?: (progress: number) => void) => Promise<void>;
}

export function createIntroTimeline(config: IntroConfig): IntroTimeline {
  const duration = config.durationMs;

  const animate = (ms: number, onProgress?: (progress: number) => void): Promise<void> => {
    return new Promise((resolve) => {
      const start = performance.now();

      const tick = (now: number): void => {
        const progress = Math.min(1, (now - start) / ms);
        onProgress?.(progress);
        if (progress >= 1) {
          resolve();
          return;
        }

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  };

  return {
    play: async (onProgress) => {
      await animate(duration, onProgress);
    },
    skip: async (onProgress) => {
      await animate(300, onProgress);
    },
  };
}
