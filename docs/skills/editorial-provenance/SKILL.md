---
name: editorial-provenance
description: Use when editing lore, fiction, quotes, transcripts, attributions, or other authored prose.
---

# Editorial provenance

## Overview

Preserve authored wording and source provenance. Agents do not create creative
copy.

## When to Use

Use for lore, dialogue, quotes, attribution, marketing copy, transcripts, and
release-note prose.

## When NOT to Use

Do not use for purely functional data with no authored wording.

## Core Process

1. Find direct user text, an existing repository source, or a cited upstream
   source.
2. Preserve wording, order, names, links, and attribution.
3. Place the copy in an existing content field.
4. Recover missing authored text from working tree, Git history, or backups.
5. Stop if the source cannot be recovered.

Never invent connective prose, headings, summaries, chapter names, or
translations presented as authored copy.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The wording is slightly off, I'll tidy it." | Authored copy is reproduced verbatim. Fix the source record and re-port from it. |
| "Removing this segment simplifies the code." | Authored content is not yours to delete. A gap in a numbered sequence is the evidence that it happened. |
| "I remember what the missing line said." | Reconstruction from memory is invention published under someone else's byline. |

## Red Flags

- New prose has no authoritative source.
- A quote or attribution was reworded.
- Missing text was reconstructed from memory.
- Authored content is *deleted* to simplify code, tidy a list, or make a test
  pass.
- A removal's stated justification does not match its diff (a commit titled
  "remove the extra ending segment" that deleted a middle segment, its authored
  lore, and its chat, then renumbered the survivors — `24cf26b5`).
- A numbered authored sequence has a gap after a change (`TRANSITION_ONE`,
  `_TWO`, `_THREE`, `_FIVE`), which means an entry was removed.

## Deleting authored content

Deleting authored content is an editorial act and needs the owner's explicit
word, exactly like writing new copy does. A deletion is harder to notice than an
invention: it leaves no wrong sentence to read, only an absence, and the loss in
`24cf26b5` went unnoticed for a long time. Before removing an authored record,
count the survivors against the authored source of truth (for Wolves segments,
`public/wolves-playlist.json`) and check every parallel array keyed by position.

## Verification

- [ ] Every added authored string has a source.
- [ ] Quotes and links are exact.
- [ ] No creative text was generated.
- [ ] The edit stayed inside an existing content surface.

## References

- `../../reference/content-map.md`
- `../../reference/wolves-runtime.md`

## Timing authored content

Changing when authored prose appears still requires exact wording, attribution, and order. Preserve locked anchors; distribute unlocked records by content cost rather than shortening, summarizing, or repeating authored prose. Verify that the available interval can display the complete record.
