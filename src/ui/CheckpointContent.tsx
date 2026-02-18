import type { ParsedCheckpointContent } from "../types/checkpoint";

export function CheckpointContent({ content }: { content: ParsedCheckpointContent }): React.JSX.Element {
  return (
    <article>
      <h2>{content.frontmatter.title}</h2>
      <p>{content.frontmatter.subtitle}</p>
      <ul>
        {content.frontmatter.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>
      {content.body ? <p>{content.body}</p> : null}
      {content.frontmatter.ctaLabel && content.frontmatter.ctaUrl ? (
        <a href={content.frontmatter.ctaUrl} target="_blank" rel="noreferrer">
          {content.frontmatter.ctaLabel}
        </a>
      ) : null}
    </article>
  );
}
