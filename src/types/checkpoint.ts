import type { NodeId } from "./world";

export interface CheckpointFrontmatter {
  id: NodeId;
  title: string;
  subtitle: string;
  highlights: string[];
  media?: string | null;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface ParsedCheckpointContent {
  frontmatter: CheckpointFrontmatter;
  body: string;
  sourcePath: string;
}
