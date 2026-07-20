---
name: design-gate
description: Use when a request could alter layout, markup, component behavior, styling, typography, navigation, responsive behavior, or animation.
---

# Design gate

## Overview

Prevent content work from changing the frozen production design.

## When to Use

Use before touching a Vue template, component, SCSS, Tailwind class, layout
value, breakpoint, navigation rule, control, or animation.

## When NOT to Use

Do not use for content-only changes that stay in documented data surfaces.

## Core Process

1. Identify the exact file and visual surface.
2. Stop unless the user explicitly approved design work.
3. Record the approved scope.
4. Verify desktop and mobile behavior in a browser.
5. Run the relevant validation.

Do not shrink type, alter spacing, change markup, or change timing to make
supplied content fit.

## Red Flags

- "Small" spacing or typography changes without approval.
- Component edits made to solve a content request.
- A visual change verified only by a build.

## Verification

- [ ] Explicit approval predates the edit.
- [ ] Diff stays inside the approved surface.
- [ ] Desktop and mobile browser checks pass.
- [ ] No unrelated design file changed.

## References

- `../../reference/wolves-runtime.md`
- `../validation/SKILL.md`
