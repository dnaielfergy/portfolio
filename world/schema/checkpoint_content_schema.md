# Checkpoint Content Contract

This document defines the markdown contract for `checkpointContentRef` files under `/content/checkpoints/`.

Only resume-specific content fields are placeholders at this phase.

## File Format

Each checkpoint file must include YAML frontmatter, followed by markdown body content.

```md
---
id: georgia_tech
title: Georgia Tech
subtitle: "<resume subtitle>"
highlights:
  - "<resume highlight 1>"
  - "<resume highlight 2>"
  - "<resume highlight 3>"
media: null
---

<optional resume narrative body>
```

## Required Frontmatter Keys

- `id` (string)
- `title` (string)
- `subtitle` (string)
- `highlights` (array of 3 to 6 strings)

## Optional Frontmatter Keys

- `media` (`null` or string path)
- `ctaLabel` (string)
- `ctaUrl` (string)

## Validation Rules

- `id` must match an existing node `id` in world config.
- One checkpoint file per node.
- `title` should match node display name or approved variant.
- `highlights` length must be 3 to 6.
- `media` path, if present, must be local and versioned.

## Placeholder Policy

Allowed placeholders:

- `subtitle`
- `highlights[]`
- markdown body narrative

Not allowed as placeholders:

- `id`
- `title`
- file naming
- content file path wiring in `checkpointContentRef`
