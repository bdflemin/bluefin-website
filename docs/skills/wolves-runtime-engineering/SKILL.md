---
name: wolves-runtime-engineering
description: Use only for explicitly approved Wolves overlay, transport, player, or runtime engineering.
---

# Wolves runtime engineering

## Overview

Gate engineering work on the frozen Wolves runtime.

## When to Use

Use only when the user explicitly authorizes overlay, transport, fullscreen, or
YouTube IFrame engineering.

## When NOT to Use

Do not use for routine content or unapproved visual work.

## Core Process

1. Confirm explicit approval.
2. Read `../../reference/wolves-runtime.md` and
   `../../architecture/runtime-data-flow.md`.
3. Preserve store ownership and player-clock synchronization.
4. Reuse the existing YouTube API loader.
5. Check async cancellation and fullscreen containing blocks.
6. Verify in Chromium and with relevant tests.

Do not introduce a second transport or wall-clock synchronization.

Every YouTube IFrame player must receive both `origin` and `widget_referrer`
from the current window. `origin` identifies the IFrame API caller;
`widget_referrer` identifies the embedding page and prevents an otherwise
playable track from being treated as an unidentified player request.

## Red Flags

- Content work is used to justify component or style changes.
- A fullscreen overlay lacks the required containing-block treatment.
- A second YouTube API loader or transport is introduced.
- Browser bounds and player states are not checked.

## Verification

- [ ] Explicit approval exists.
- [ ] Relevant unit tests pass.
- [ ] Typecheck and build pass.
- [ ] Chromium checks cover bounds and controls.
- [ ] Production deployment follows the validation skill.

## References

- `../../reference/wolves-runtime.md`
- `../../architecture/runtime-data-flow.md`
- `../design-gate/SKILL.md`

## Timing lessons

- Keep scheduler and renderer on one content-cost timing model.
- Treat Wolves lore as a self-paced video presentation, not an interactive
  document: the renderer must advance and hold readable content automatically.
  Do not require, offer, or depend on pointer, click, touch, keyboard, or
  scrolling interaction; viewers must never need to operate the experience to
  follow a conversation or its climax.
- Render chatlogs and quotes as noninteractive, sentence- or word-bounded
  pages. Show one complete readable beat at a time, retain the speaker header
  on continued chat beats, and automatically type, hold, then replace it; do
  not accumulate important text behind an overflow viewport.
- Lore surfaces must never expose a scrollbar. When a complete quote or dossier
  exceeds its viewport, advance its hidden scroll position from the active
  player clock over the scheduled record window; audience input is never a
  narrative dependency.
- Fast music or slideshow slots must not accelerate ordinary chat typing; keep
  explicitly approved dialogue cadence anchors unchanged.
- For a locked chat window, use its full player-clock duration when it exceeds
  the minimum readability estimate. This retains the final sentence through
  the authored endpoint instead of releasing a couch-readable chat early.
- The Track 0 finale barrage begins at the measured 5:55 pickup
  (`TRACK_ZERO_SECTIONS.bkEnd`); distribute its curated contributor photos
  across subsequent measured beats rather than cutting every beat.
- When a narrative range is constrained, allocate chatlog readability before
  static quote or source records; preserve explicitly approved cadence locks.
- The authored final conversation remains noninteractive after its key line is
  revealed; it must advance and hold without scroll or skip controls.
- Add a locked hero photo as a contiguous timed window and shift only the
  following unlocked window; do not move the established hero anchors.
- Preserve locked anchors and recompute only unlocked intervals.
- Derive Track 0's rotating HUD queue directly from the authored plan and keep
  duplicate status lines; deduping breaks the approved finale cadence.
- Prefer invariant tests over stale exact timestamps for recomputed intervals.
- A build is not runtime proof; verify the real Wolves route in Chromium at short/long records and locked anchors.
- Never describe a discarded experiment as restored or complete.

## Verification

Re-derive the unified Track 0 queue and finale timing from source with:

```bash
npm run test:run -- src/tests/wolvesThesisSequence.test.ts
```
