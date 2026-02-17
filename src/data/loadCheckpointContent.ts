import type { ParsedCheckpointContent } from "../types/checkpoint";
import type { NodeId, WorldConfig } from "../types/world";
import { parse as parseYaml } from "yaml";

const cache = new Map<NodeId, ParsedCheckpointContent>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFrontmatter(raw: string): { frontmatterData: unknown; body: string } {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("Checkpoint markdown must contain YAML frontmatter delimited by ---");
  }

  const [, frontmatterRaw, bodyRaw] = match;
  const frontmatterData = parseYaml(frontmatterRaw ?? "");
  return {
    frontmatterData,
    body: (bodyRaw ?? "").trim(),
  };
}

function parseContractFrontmatter(frontmatterData: unknown): ParsedCheckpointContent["frontmatter"] {
  if (!isRecord(frontmatterData)) {
    throw new Error("Checkpoint frontmatter must be a YAML object");
  }

  const id = frontmatterData.id;
  const title = frontmatterData.title;
  const subtitle = frontmatterData.subtitle;
  const highlights = frontmatterData.highlights;
  const media = frontmatterData.media;
  const ctaLabel = frontmatterData.ctaLabel;
  const ctaUrl = frontmatterData.ctaUrl;

  if (typeof id !== "string" || typeof title !== "string" || typeof subtitle !== "string") {
    throw new Error("Checkpoint frontmatter missing required keys: id, title, subtitle");
  }

  if (!Array.isArray(highlights) || highlights.some((item) => typeof item !== "string")) {
    throw new Error("Checkpoint highlights must be an array of strings");
  }
  if (highlights.length < 3 || highlights.length > 6) {
    throw new Error("Checkpoint highlights must contain between 3 and 6 items");
  }

  if (!(media === undefined || media === null || typeof media === "string")) {
    throw new Error("Checkpoint media must be null, undefined, or a string path");
  }
  if (!(ctaLabel === undefined || typeof ctaLabel === "string")) {
    throw new Error("Checkpoint ctaLabel must be a string if provided");
  }
  if (!(ctaUrl === undefined || typeof ctaUrl === "string")) {
    throw new Error("Checkpoint ctaUrl must be a string if provided");
  }

  return {
    id,
    title,
    subtitle,
    highlights,
    media: media ?? null,
    ctaLabel,
    ctaUrl,
  };
}

export async function loadCheckpointContent(
  nodeId: NodeId,
  worldConfig: WorldConfig,
): Promise<ParsedCheckpointContent> {
  const cached = cache.get(nodeId);
  if (cached) {
    return cached;
  }

  const node = worldConfig.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) {
    throw new Error(`Cannot load checkpoint content for unknown node '${nodeId}'`);
  }

  const response = await fetch(node.checkpointContentRef);
  if (!response.ok) {
    throw new Error(`Failed to load checkpoint markdown '${node.checkpointContentRef}'`);
  }

  const raw = await response.text();
  const { frontmatterData, body } = parseFrontmatter(raw);
  const frontmatter = parseContractFrontmatter(frontmatterData);

  if (frontmatter.id !== nodeId) {
    throw new Error(
      `Checkpoint frontmatter id '${frontmatter.id}' does not match requested node '${nodeId}'`,
    );
  }

  const parsed: ParsedCheckpointContent = {
    frontmatter,
    body,
    sourcePath: node.checkpointContentRef,
  };

  cache.set(nodeId, parsed);
  return parsed;
}
