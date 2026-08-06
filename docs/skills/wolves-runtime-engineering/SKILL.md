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
- A musical moment is scheduled with a round number instead of the measured
  beat in `TRACK_ZERO_SECTIONS`.
- A page ends on a title such as `Dr.`, orphaning the name it introduces.
- A page ends on a preposition or article, making the audience wait a page turn
  for the rest of the phrase.
- A slot is assumed to display its record's authored pages without checking
  `affordablePageCount()` against the slot duration.

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

The song has 425 seconds. Both locked anchors derive their start from a
measured beat: `lorem-pursuit-1` from `bridgeStart` and
`blue-universal-acquires-wayland-yutani` from `finaleStart`. See "Anchoring
text to the music" below — neither start is a round number.

- Allocation is per whole page: a record's floor is one complete held page, its
  ideal is every authored page held for its reading cost. `allocateLoreSlots()`
  never allocates below the floor.
- **The floor is what makes oversubscription invisible.** When 27 records
  competed for ~400 seconds against ~900 seconds of authored pages, nothing
  errored. Every record was floored at one page, so a record with eight
  authored pages rendered page one and vanished. 17 of 27 records were cut
  mid-record, including Sarah's closing line and the death of Dr. Anderson.
  A record that is cut looks exactly like a record that is short.
- No renderer change can fix that. Cutting records or extending the range is a
  human decision — get it, then act on it. Do not "solve" it by shrinking pages
  below a readable hold.
- **Curate by dropping the worst-served record, then re-solve.** Hiding
  cascades: freeing a slot lets survivors expand, so the fix is not "hide every
  record currently cut". Greedily drop the record showing the smallest fraction
  of itself (tie-break on largest ideal duration) and recompute until every
  survivor shows 100%. That took 17 cut records down to 11 hidden.
- Hidden records live in `hiddenFromWolvesVideoArtifactIds`. Hiding is
  reversible and lossless; a fragment on screen is neither.
- **Audit with a probe, not by eye.** Compare each slot's duration against
  `affordablePageCount()` versus the record's authored page count. Anything
  below 100% is a record the audience sees the beginning of and nothing else.

## Timing lessons

- Keep scheduler and renderer on one content-cost timing model.
- Treat Wolves lore as a self-paced video presentation, not an interactive
  document: the renderer must advance and hold readable content automatically.
  Do not require, offer, or depend on pointer, click, touch, keyboard, or
  scrolling interaction; viewers must never need to operate the experience to
  follow a conversation or its climax.
- Render chatlogs and quotes as noninteractive, sentence- or word-bounded
  pages. Show one complete readable beat at a time, retain the speaker header
  on continued chat beats, and hold then replace it; do not accumulate
  important text behind an overflow viewport.
- **Every lore view is a pure function of `elapsed`.** Chat and prose share one
  clock-driven page model: `pickPageIndexForElapsed(pages, elapsed, duration)`.
  No view owns a timer.

  The chat view used to be a character-by-character typewriter on a
  `setInterval` started at mount that never read `props.elapsed`. It was the
  one panel whose pace was its own opinion, and it cost the show three separate
  defects: it drifted against the music so a line could only hit a beat by
  luck, it could not be seeked or rehearsed from a fixed point, and it held its
  slot open past the end (via a `chat-complete` handshake) so every record
  after it started late. Deleting the typewriter deleted all three.

  A view that reads the clock is reproducible: same second, same frame, every
  machine, every rehearsal. A view that runs a timer is not.
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

Reaching Track 0 in Chromium is not automatic. The standalone Playwright scripts
in `tests/*.mjs` mock the YouTube IFrame API and must then leave the Destiny
intro before any Track 0 selector exists.

**You cannot leave the intro with the progress bar.** `handleSegmentSeek` in
`src/WolvesApp.vue` routes a bar click to `intro.seekToRatio()` while the intro
overlay is showing, which seeks *inside* the intro sequence. Harnesses that
clicked `.wc-widget-progress` at an "overall" ratio sat in the intro forever and
timed out waiting for `.wc-trackzero-grid`.

Use the DEV-only hooks instead. Three exist, published at different times:

| Hook | Published by | Available |
|---|---|---|
| `window.__wolvesDurations` | `WolvesApp.vue` | From app start |
| `window.__wolvesIntro` | `WolvesIntroOverlay.vue` | While the intro overlay is mounted |
| `window.__wolvesCinematic` | `WolvesApp.vue` | Only after the stage starts |

Waiting on `__wolvesCinematic` while still in the intro therefore hangs forever.

`__wolvesDurations` exposes `intro()`, `overall()`, and `skipIntro()`. Read the
durations from it rather than hard-coding them: the literals `119.5` and `1952.5`
that both harnesses carried are now `116.8` and `1949.8`, and that drift is what
silently broke them. All three hooks are `import.meta.env.DEV` gated and absent
from the production bundle — verify with
`grep -c __wolvesDurations dist/assets/wolves-*.js`, which must print `0`.

`skipIntro()` starts the real stage, so a harness that has not installed the
YouTube IFrame mock hangs on `stage.start()`. Install the mock first; copy it
from `tests/wolves-trackzero-sidecar-real-player.mjs`.

**Do not build a new full-show harness to check a Track 0 anchor.** This was
tried and abandoned; record the outcome so it is not tried a fifth time. A
one-off probe can be walked out of the intro by clicking `.wc-lobby-enter` (the
user gesture browsers require before media may play) and then calling the intro
overlay's exposed `next()` in a loop, found by walking the Vue tree from
`document.querySelector('#app').__vue_app__._instance` through `subTree`. That
path is not repeatable: the number of `next()` calls needed to land in Track 0
is not stable, 60 steps under-shoots and never mounts `[data-lore-view]`, and 80
steps mounts a panel that reads as empty text. Two further traps cost real time:
`window.__wolvesCinematic.seekTo` is offset by the intro, so passing it a Track 0
time seeks back into the intro and unmounts the lore column; and Playwright's
default 30 s locator timeout turns each such failed read into a 30 s stall, so a
polling loop looks like a hang rather than a failure. Assert anchored moments in
`src/tests/wolvesLoreColumn.test.ts` against the page model instead, where the
Sarah-on-`bridgeStart` regression test already lives, and reserve browser runs
for the existing `tests/wolves-movie-flow.mjs`.

`tests/wolves-movie-flow.mjs` asserts Track 0 beats but stops at 196.36 (Jorge),
one slide before the Laura -> Tophee -> Reza boundary. That blind spot is exactly
where a dropped portrait shipped unnoticed. Extend coverage past any boundary you
change.

## Locked slide windows

Track 0 hero portraits are pinned to authored windows in
`src/data/wolves-track-zero-slides.ts`, but the schedule is assembled in
`WolvesComicReader.vue`, and the two drift apart in two specific ways. Both have
already shipped bugs.

- **The pool slice must cover every hero index.** `peoplePool1` is built from
  `shuffledPeople` by index range, then hero portraits are found inside it by id.
  A slice that stops short of the last hero index silently drops that portrait:
  `pinTrackZeroPostHeroOpening` prepends six slides, so hero indices run 6..14,
  and `slice(7, 14)` lost Tophee at index 14 while `peoplePool2 = slice(15, 39)`
  never picked him up. Nothing threw, no test failed, and the slide vanished from
  the show.
- **Anchor a locked slide to its own window, never to the running clock.**
  Pushing a locked portrait with `startTime: currentTime` makes it inherit any
  upstream drift. When Tophee disappeared, Reza moved from his locked 204.52 to
  200.44 while his `endTime` stayed 212.68 — so the portrait ran 12.24 s against
  a `duration` field still claiming 8.16 s, the crossfade derived from `duration`
  was wrong, and the "HAMI brings Bazzite" title above him was misaligned by
  4.08 s. The data layer and its unit tests were all correct; only the assembled
  schedule was wrong. Use `startTime: <slide>TrackZeroWindow.startTime`.

Verify a window change by dumping the rendered slide at boundary times, mounting
fresh at each time. `setProps` alone does not swap the displayed buffer in jsdom
because the incoming image never loads, so a stale slide keeps reporting and the
check silently passes.

## WolvesComicReader serves more than Wolves

`WolvesComicReader.vue` drives three different shows and only one is the
presentation:

- `timelineSlides` — the Wolves Track 0 schedule (`wolvesExperience` true).
- `laterTrackPhotos` — Wolves tracks 1 and later.
- `mixedPhotos` — the ten other albums in `public/experiences/catalogue.json`.

`mixedPhotosToUse` only swaps in `timelineSlides` when `wolvesExperience` is
true, so `mixedPhotos` is live for every non-Wolves album. It reads as dead
legacy code beside the newer Wolves path, and an audit flagged ~113 lines of it
for deletion; deleting it would have broken ten experiences while leaving
`/wolves/` working, so a `/wolves/` smoke test would not have caught it. Check
whether the non-Wolves experiences reach a symbol before removing it from this
component.

Related: `isExperimental` near the top of the component is a permanently-true
flag, so it reads as a dead branch gate. That is not a licence to delete the
branch it guards.

## Anchoring text to the music

Some moments must land on a measured beat, not near one. There are two:

- The finale: the audience must read that Dr. Andy Anderson is dead on the same
  beat the score says **Become Legend** (`finaleStart`, 408.137).
- The Golden Era transmission: Sarah's closing line, "Thus becoming One, from
  the Seven...", lands on the chanting bridge (`bridgeStart`, 229.204).

The rule is **the text moves to the music, never the music to the text.**
`TRACK_ZERO_SECTIONS` in `src/data/wolves-track-zero-beats.ts` holds measured
beat times. `finaleStart` (408.137) is one of them. A round number like `408` or
a slot starting at `398` is an authored guess; a measured beat is ground truth.

Do not schedule such a moment by writing down the start time you happened to
measure. Derive it:

```ts
// wolves-narrative-timeline.ts
const finalRecordStartTime = TRACK_ZERO_SECTIONS.finaleStart
  - REVEAL_LEAD_SECONDS
  - costOfPagesBeforeTheReveal
```

`REVEAL_LEAD_SECONDS` (0.01) is not superstition. `pickPageIndexForElapsed`
selects with a strict `<`, so a page timed to land on the exact beat wins or
loses on float rounding — the first attempt at the finale showed the *previous*
page on the beat. Ten milliseconds is well under a video frame and settles it.

Both anchors are also end-anchored, not just start-anchored: an anchored record
must be given a slot at least as long as its authored pages cost. The Golden Era
transmission was previously pinned to a hard-coded 150-220, which was 19 seconds
short of its own content, so it was cut at page 8 of 11 and Sarah's line never
reached the screen at all. Anchoring the *last* page to a beat and sizing the
slot from the record's own read cost fixes both ends at once.

The start depends on what the earlier pages cost to read. Hard-coding it means
the reveal silently slides off the beat the moment anyone re-edits the bulletin
or changes the reading pace — and nothing fails, it just stops landing.

Both sides of a synchronised moment must read the same constant. The thesis cue
uses `TRACK_ZERO_SECTIONS.finaleStart` too, so the caption and the reveal cannot
drift apart. `src/tests/wolvesFinaleReveal.test.ts` asserts the page shown at the
beat, the page shown just before it, and the cue text, so a drift fails loudly.
`wolvesLoreColumn.test.ts` does the same for Sarah against `bridgeStart`, using
the real scheduled slot rather than a fixture duration.

When you change one of these anchors, expect tests asserting the old round
number to fail. Rebind them to the measured constant; do not re-record them as
known failures.

## Pages break at thoughts, not at character counts

`splitReadableBeats()` splits on sentence punctuation and then on a character
budget. Left alone, that budget breaks wherever the count runs out — after
`Dr.`, or on a stranded preposition. Both happened in the closing bulletin and
between them they cut the show's central reveal into pieces.

`readable-beats.ts` guards this in three stages:

- `mergeAbbreviationSplits()` rejoins sentences split at a title's period.
- `fuseTitledNames()` fuses a title with the capitalised words after it into one
  unbreakable token, so "Dr. Andy Anderson" is laid out as a single unit.
- `settleBreaks()` repairs a page that ends on a dangling function word by
  moving the whole trailing phrase to the next page. It only touches pages that
  end badly; a page ending on a complete thought is already a good page.

The measurable target: **no page ends on a dangling function word.** At the time
of writing that holds for all 338 pages in the show.

When touching this file, verify no page overflows its budget afterwards. A fuse
that is too greedy silently produces pages too tall to read from the back row:

```bash
npx vite-node <probe that pages every record and compares against
PROSE_PAGE_CHARACTERS / CHAT_PAGE_CHARACTERS>
```

At the time of writing: 338 pages, zero over budget, zero ending on a dangling
word, worst page 150 characters against a 190 budget.

`src/tests/wolvesFinaleReveal.test.ts` asserts the dangling-word rule across
every record, so a greedy change to the splitter fails immediately.
