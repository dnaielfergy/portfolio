import type { IntroConfig } from "../types/world";

export interface IntroTimeline {
  play: () => Promise<void>;
  skip: () => Promise<void>;
}

export function createIntroTimeline(config: IntroConfig): IntroTimeline {
  const duration = config.durationMs;

  return {
    play: async () => {
      await new Promise((resolve) => setTimeout(resolve, duration));
    },
    skip: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    },
  };
}
