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

## Lore display model

The Wolves lore column is a theater text display, not a document. One panel,
one metadata block, one page model, one type scale, no scrolling.

- `src/components/wolves/lore/lore-pages.ts` is the single page model. Both the
  scheduler (`src/data/wolves-lore-timing.ts`) and every lore view cost content
  with it, so an allocated slot always matches what is rendered. Never add a
  second splitter or a per-view character constant.
- `src/components/wolves/lore/lore-dossier.scss` owns the only panel and the
  only type scale. Sizes are container-relative (`cqi` against
  `.lore-dossier-panel`, which sets `container-type: inline-size`) so type and
  spacing track the panel the theater layout hands the column, not the viewport.
  No view may hardcode a body `font-size`; consume `--lore-body-size`,
  `--lore-title-size`, `--lore-meta-size`, `--lore-gap`.
- The site sets `html { font-size: 63.5% }`, so `1rem` is about `10.16px`. A rem
  value copied from a normal 16px-root design reads roughly 1.6x too small here.
  Size lore type by measured px in Chromium, not by rem intuition.
- Every view renders `LoreRecordHeader.vue`: fixed uppercase kind eyebrow,
  record title, and one inline spec row of at most three key/value pairs. No
  footers, no telemetry (status, phase, resource name, fingerprint) - that is
  noise on a theater screen.
- Page budgets must include per-block chrome. `BLOCK_OVERHEAD_CHARACTERS`
  charges each block for its speaker label and block gap; without it a page of
  short speaker blocks renders far taller than its character count predicts.
- Any block longer than a page is split before packing. A page that cannot be
  split is a page that clips.
- Renderers self-limit with `affordablePageCount()`: a slot never shows a page
  it cannot hold for that page's reading cost, so no page flashes past.

## Timeline oversubscription math

The song has 425 seconds and the lore column shows 27 records. Locked anchors
consume 150-220 (`lorem-pursuit-1`) and 398-425
(`blue-universal-acquires-wayland-yutani`).

- Allocation is per whole page: a record's floor is one complete held page, its
  ideal is every authored page held for its reading cost. `allocateLoreSlots()`
  never allocates below the floor.
- The 220-398 range has 178 seconds for 18 records. Their one-page floors total
  about 165s (it fits), but their full authored pages total about 487s. Roughly
  309 seconds of authored pages therefore never display.
- No renderer change can fix that. Report the overflow; do not delete authored
  lore and do not "solve" it by shrinking pages below a readable hold. Cutting
  records or extending the range is a human decision.

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
- Lore surfaces must never expose a scrollbar. Quotes advance from the active
  player clock as complete sentence- or word-bounded pages, held for their
  reading cost before automatic replacement; audience input is never a
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

## Driving Track 0 in a browser

Reaching Track 0 in Chromium is not automatic; the standalone Playwright scripts
in `tests/*.mjs` mock the YouTube IFrame API and then have to get past the
Destiny intro before any Track 0 selector exists.

Two DEV-only hooks exist and they are not interchangeable:

- `window.__wolvesIntro` — published by `WolvesIntroOverlay.vue` while the intro
  overlay is mounted (`seekTo`, `seekToNativeTime`, `getDuration`, ...).
- `window.__wolvesCinematic.seekTo` — published by `WolvesApp.vue` and delegated
  to the stage, so it exists only after the stage mounts.

Waiting on `__wolvesCinematic` while still in the intro therefore hangs forever.

`tests/wolves-trackzero-sidecar-real-player.mjs` advances past the intro by
synthesising a click on `.wc-widget-progress` at
`(INTRO_DURATION + 20) / OVERALL_DURATION`. Both constants are hard-coded
(`119.5` and `1952.5`) and have drifted from the runtime, so the click no longer
leaves the intro and `.wc-trackzero-grid` never appears. Treat that script as
currently unable to reach Track 0, and re-derive the constants from the runtime
before trusting or extending it rather than assuming the app regressed.
