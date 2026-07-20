---
name: skill-authoring
description: Use when creating, restructuring, reviewing, or retiring an agent skill.
---

# Skill authoring

## Overview

Keep agent workflows discoverable, independently loadable, concise, and current.

## When to Use

Use when a durable repository rule needs a new skill or an existing skill is
stale, duplicated, or too large.

## When NOT to Use

Do not use for session notes, progress reports, issue ledgers, speculative
features, or one-off task instructions.

## Core Process

1. Search `../INDEX.md` and existing skills for an owner.
2. Create a directory named with lowercase hyphenated words.
3. Add `SKILL.md` with YAML `name` and `description` front matter.
4. Use the standard sections: Overview, When to Use, When NOT to Use, Core
   Process, Red Flags, Verification, References.
5. Keep the entry file below 500 lines and preferably below 1,500 tokens.
6. Move detailed facts to a directly linked reference file.
7. Update `../INDEX.md`.
8. Validate links, front matter, size, and source accuracy.

Use standard GFM Markdown. MCP does not define a skill filesystem layout; this
layout follows the Agent Skills convention.

## Red Flags

- A second skill owns the same rule.
- The skill contains current status or session history.
- The skill describes an unsupported feature.
- The entry file contains a long architecture reference.
- The skill has no verification criteria.

## Verification

- [ ] Front matter is valid.
- [ ] `name` matches the directory.
- [ ] The index links to the skill.
- [ ] References resolve.
- [ ] The skill states triggers and exclusions.
- [ ] The skill has verification criteria.
- [ ] The documented behavior exists in source.

## References

- `../INDEX.md`
- `../../reference/`
- `AGENTS.md`
