---
name: skill-improvement
version: "1.0"
last_updated: 2026-07-17
tags: [skills, documentation, agents]
description: Use when a task reveals reusable repository knowledge, an agent instruction is wrong or duplicated, or a skill needs to be created, corrected, or streamlined.
metadata:
  type: procedure
---

# Skill Improvement

## When to Use

Use when a session discovers durable agent knowledge or finds duplicated, stale, or missing guidance.

## When NOT to Use

One-off task notes and current status do not belong in skills.

## Core Process

Every completed implementation has two possible outputs:

1. The requested work.
2. A reusable learning, only when the session found one.

Update the closest existing skill in the same change when the learning is durable, non-obvious, and useful to future agents.

| Discovery | Action |
|---|---|
| Reusable repository behavior | Update the owning skill |
| Project-internal fact | Add a command or source path that re-derives it |
| One-off task detail | Keep it out of skills |
| New domain with distinct authority or verification | Create one focused skill; add it to the router and index |
| Contradiction | Correct the canonical owner; do not add another copy |

## Banned

- Changelogs, session logs, progress notes, plan files, and append-only agent journals.
- Ephemeral CI or deployment status in skills.
- New skills when an existing skill owns the domain.
- Duplicated non-negotiables.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I will document it later." | Reusable learning ships with the work. |
| "A new skill is cleaner." | Update the existing owner unless the domain is genuinely new. |

## Red Flags

- Session-dated narrative.
- Duplicate rules.
- A new skill with the same authority as an existing one.

## Verification

- [ ] The learning is reusable.
- [ ] The closest owner was updated.
- [ ] Router and index changed only if discovery needs changed.
- [ ] No stale status or session narrative was committed.
