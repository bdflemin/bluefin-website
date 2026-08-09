# Wolves browser harnesses and player mocks

**Agents edit content. Agents never edit design.**

Defect-derived invariants for driving `/wolves/` from Playwright and unit
tests: reaching Track 0, keeping the movie-flow harness alive, emitting a real
player load lifecycle from a mock, and deriving expectations from live modules
instead of constants.

Procedure and approval gate: [`../skills/wolves-runtime-engineering/SKILL.md`](../skills/wolves-runtime-engineering/SKILL.md).
Show-wide production facts: [`wolves-runtime.md`](wolves-runtime.md).

Numbering in this file: "Track 0" is the comic reader's `trackIndex` 0 —
"7 Days to the Wolves", segment index 0 — the first music after the intro.
`wolves-runtime.md` uses show numbering, where Track 0 is the Destiny intro.

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
`window.__wolvesDurations` (`WolvesApp.vue`, from app start),
`window.__wolvesIntro` (`WolvesIntroOverlay.vue`, while the overlay is mounted),
and `window.__wolvesCinematic` (`WolvesApp.vue`, only after the stage starts).
Waiting on `__wolvesCinematic` while still in the intro therefore hangs forever.

`__wolvesDurations` exposes `intro()`, `overall()`, and `skipIntro()`. Read the
durations from it rather than hard-coding them: the literals `119.5` and `1952.5`
that both harnesses carried have already drifted, which is what silently broke
them. All three hooks are `import.meta.env.DEV` gated and absent from the
production bundle — verify with
`grep -c __wolvesDurations dist/assets/wolves-*.js`, which must print `0`.

`skipIntro()` starts the real stage, so a harness that has not installed the
YouTube IFrame mock hangs on `stage.start()`. Install the mock first; copy it
from `tests/wolves-trackzero-sidecar-real-player.mjs`.

**Do not build a new full-show harness to check a Track 0 anchor.** This was
tried and abandoned four times; the walk-the-Vue-tree route (clicking
`.wc-lobby-enter`, then looping the overlay's exposed `next()`) is not
repeatable — the step count needed to land in Track 0 is unstable, and
`window.__wolvesCinematic.seekTo` is offset by the intro, so a Track 0 time seeks
back into the intro and unmounts the lore column. Playwright's 30 s default
locator timeout makes each failed read look like a hang. Assert anchored moments
in `src/tests/wolvesLoreColumn.test.ts` against the page model instead, where the
Sarah-on-`bridgeStart` regression test already lives, and reserve browser runs
for the existing `tests/wolves-movie-flow.mjs`.

To reach the welcome card in a probe, click the lobby's **Meet your Teammates**
button (`emit('enter')`); the Director's Cut button opens the same card first.
The card's prose renders as `.wolves-intro-title-card-quote`, *not*
`.wolves-intro-overlay-text` — waiting on the latter silently burns the card's
whole runtime before matching the segment after it.

`tests/wolves-movie-flow.mjs` asserts Track 0 beats but stops at 196.36 (Jorge),
one slide before the Laura -> Tophee -> Reza boundary. That blind spot is exactly
where a dropped portrait shipped unnoticed. Extend coverage past any boundary you
change.

## Adding a segment breaks the movie-flow harness at the front

`tests/wolves-movie-flow.mjs` (CI job `wolves-movie-flow`) drives the show from
the lobby door. It assumes the Destiny player mounts within ten seconds of
entering, so prepending any segment ahead of it kills the entire run at step
three and the remaining twenty-odd assertions never execute. The job goes red
with a **passing** count of two, which reads like a small failure and is not.
When you add a segment to the front, teach the harness to step past it: assert
the new segment, then advance with the transport control before waiting on the
player. A shrinking "passed" count is the signal that the harness is dying
early rather than failing a check.

Three traps in that harness, all of which cost real time:

- **Cross-dissolves put two elements in the DOM at once.** `[data-comic-hero-shot]`
  matches both the leaving and entering image mid-fade — a strict-mode violation,
  not a failed assertion. Qualify with `:not(.comic-hero-shot-fade-leave-active)`.
- **The transport widget auto-hides.** Scripted `page.evaluate()` seeks are not
  pointer input, so the controls slide off screen and clicks report "outside of
  the viewport". Nudge `page.mouse` and let the reveal transition finish first.
  This also means never clicking `Next` with a raw `page.getByLabel('Next')` —
  two controls share the label (overlay + transport), and the raw locator
  intermittently resolves to the off-viewport one and times out after 30 s. Use
  the harness's `clickControl()` helper, which nudges the pointer and clicks the
  visible match.
- **Cue windows drift out from under seek times.** A seek one second before a
  plate's window opens fails by timeout, which looks like a missing element
  rather than a stale constant. Check the cue's `start`/`end` in
  `wolves-intro-sequence.ts` before believing the component is broken.

## The mock player must emit the real load lifecycle

`useDualBufferPlayer.start()` awaits a promise that only resolves when the
**active** player fires an `onStateChange` to `PLAYING` after
`loadVideoById(...)`. The real IFrame API buffers and autoplays after a load;
a mock whose `loadVideoById` only records the video id never emits that
transition, so `start()` never settles, `handleIntroComplete()` in
`WolvesApp.vue` never reaches `introTransparent = true`, and
`.wolves-intro-overlay--transparent-handoff` never appears. That is issue
#706's exact failure: the harness dies at the intro handoff with the overlay
stuck opaque, and every Track 0 assertion after it silently never runs.

When writing or copying the mock (`tests/wolves-movie-flow.mjs` has the
canonical one):

- `loadVideoById` must set `currentTime` to `startSeconds` and then emit
  `BUFFERING` → `PLAYING` state changes asynchronously (microtask is enough).
- `cueVideoById` must set `currentTime` and emit `CUED` — the dual buffer cues
  the inactive side and then prewarms it with `playVideo`, which parks it back
  on `PLAYING` (`parkPrewarmedSide`).
- Forcing `ENDED` or seeking past the intro cut does **not** unstick the
  handoff; the await is on the *cinematic stage's* load-play transition, not
  on the intro player at all.

## Derive harness expectations from the live modules, not constants

Most of the movie-flow harness's historical failures were stale constants,
not runtime defects. The show's timing is derived — lore slots from reading
cost (`wolves-narrative-timeline.ts`), rotating signals paced by
`getTrackZeroHudLabel`, slide windows re-measured in
`wolves-track-zero-slides.ts` — so any hard-coded time or expected string in a
test drifts the moment content is re-edited. Under the Vite dev server a
Playwright page can import the authored modules directly:

```js
const timeline = await page.evaluate(async () => {
  const mod = await import('/src/data/wolves-narrative-timeline.ts')
  return mod.wolvesNarrativeTimeline
})
```

Use this to compute slot boundaries, slide-window straddles (± a small
epsilon; the hero-run windows have already shifted by 0.001 s once), the
paced finale message list (`getTrackZeroSectionMessages(4)` — the old
`wolves-incoming-signal.txt` is no longer the runtime source), and the air
time of a specific rotating signal (scan `getTrackZeroHudLabel` over the
window). Assert the DOM against those derived values. Selectors go stale the
same way: the lore title is `.lore-dossier-title` (`LoreRecordHeader`), not
the old `.conversation-title`, and the lore page viewport intentionally clips
(`overflow: hidden` in `lore-dossier.scss`) — it is not a scroll surface.
