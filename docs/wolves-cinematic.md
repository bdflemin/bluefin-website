# Wolves Cinematic — Architecture and Engineering Reference

Production documentation for **Bluefin: Seven Days to the Wolves** (`/wolves`)
after the 2026-07-16 cinematic rebuild. This supersedes the architecture
sections of `docs/wolves-maintenance.md` (whose content rules — authored lore,
slideshows, editorial policy — still apply) and records the engineering
knowledge accumulated during the rebuild so future maintainers do not relearn
it the hard way.

Companion user-facing document: `wolves/README.md` (setup, deployment,
simplicity audit). Verified live at commit `9d78d25`.

## 1. System overview

The experience is a single Vue 3 + Pinia page with four phases, held in one
store field (`useCinematicStore().phase`), no router:

```
lobby -> intro -> cinematic -> finished
```

| Phase | Component | Role |
|---|---|---|
| lobby | `cinematic/CinematicLobby.vue` | Destiny-styled gate. No account, no OAuth; the click is the browser autoplay gesture. |
| intro | `WolvesIntroOverlay.vue` | The authored 94s prologue cold open + Destiny guardian trailer, driven by `src/data/wolves-intro-sequence.ts`. |
| cinematic | `cinematic/CinematicStage.vue` | Dual-buffer YouTube playback of the seven musical parts, with the theater layer above. |
| finished | inline in `WolvesApp.vue` | End plate + replay. |

Three invariants hold everywhere:

1. **The store is the only data path.** Players and the intro overlay publish
   into `stores/cinematic.ts`; the widget, plate, captions, theater layer, and
   transitions are pure subscribers. No component passes playback data to
   another.
2. **All sync is `getCurrentTime()`-driven.** Nothing timeline-synced uses
   wall-clock time (see section 5, ad resilience).
3. **One transport.** The full-width hero widget (`MediaWidget.vue`) is the
   only playback control surface in both the intro and the cinematic. The
   intro overlay exposes `next/previous/toggle/seekToRatio` and emits
   `status`; the stage exposes the same shape for the dual-buffer player.
   `WolvesApp.vue` wires whichever phase is active to the widget.

## 2. The dual-buffer player (`composables/useDualBufferPlayer.ts`)

Two `YT.Player` instances (sides `a`/`b`). While one plays segment N, the
other holds N+1 cued and muted at opacity 0. The handoff:

- A 100ms poll reads the active player's `getCurrentTime()`/`getDuration()`.
- At `duration - PRE_END_THRESHOLD_S` (0.3s — YouTube videos end on a black
  frame) the composable flips `activeSide`; CSS transitions the two layers'
  opacity over the segment's `crossfadeMs` while an rAF loop ramps
  `setVolume()` on both players. `ENDED` remains as a fallback for throttled
  background tabs.
- The freed side then cues N+2. Manual prev/next hard-loads the target on the
  inactive side (it has the wrong video buffered for backward jumps); the
  transition overlay's 6s hold covers the buffering gap.
- Authored trims are supported per segment (`startSeconds`/`endSeconds` on the
  native timeline); elapsed/duration are reported window-relative while
  `store.nativeTime` keeps the raw clock for caption/lore/thesis sync.

Segments live in `src/config/wolves-cinematic.ts` (derived from tracks 1-7 of
the authored `public/wolves-playlist.json`). Adding/reordering parts is a data
change only.

## 3. The theater layer (`cinematic/TheaterExperience.vue`)

Mounted over the video on every part; the video is the audio source and is
never the visual. This reuses the original immersive theater's locked
components unchanged:

- **7 Days (`trackZeroExperience: true`)**: 2fr/1fr grid — `WolvesComicReader`
  (`trackIndex=0`, the authored beat-synced slideshow with all hero locks,
  including the Bluefin group: sherman, m2, kyle, hikari, jorge-bluefin at
  contiguous 4.08s windows 175.96-196.36s) plus `WolvesLoreColumn` (narrative
  timeline) on the right, plus the thesis overlay (345-425s) rendered in
  Destiny type. The thesis `warning` string renders **only** in the lore
  sidebar's news record, not in the overlay.
- **Parts 2-7**: centered CNCF community gallery (`grid--gallery` mode). One
  **persistent** reader instance across all parts preserves the single
  Fisher-Yates shuffle — remounting it per segment would reset
  `shownLaterTrackPhotoIds` and reuse photos, violating the no-reuse rule.
- **Wallpaper layers**: the original monthly day/night pairs
  (`img/wallpapers/bluefin-NN-{day,night}.webp`) crossfade over 1.5s with a
  sine-modulated night blend; progress spans the whole show as
  `(segmentIndex + trackProgress) / 7`, December stays out of rotation. Do
  not put a darkening scrim over these — the theater renders at full
  brightness (a scrim was added and reverted in production).

The comic-reader portal must fill its full column: the `:deep(#comic-reader)`
height/flex overrides carried over from the original `WolvesApp.vue` are what
make the viewport large; without them the reader letterboxes small.

## 4. The intro overlay (`WolvesIntroOverlay.vue`)

Two authored segments from `buildIntroVideoSequence()`:

1. **`wolves-prologue`** — 94s text cold open over authored backgrounds, with
   the Gayane Ballet Suite (Adagio) as a background-only YouTube audio embed.
   The 94s figure is not arbitrary: per-second RMS loudness analysis of the
   track showed the final swell building from 89s, cresting at 92-94s, and
   resolving to near-silence by 98s. A flat 90s cut slices mid-crescendo;
   94s with the `audioFadeOutSeconds: 2.5` ramp rides the phrase's own decay.
   Cue clock = the audio embed's `getCurrentTime()` (not wall clock), and the
   fade window is recomputed every tick so seeking back out of it restores
   full volume.
2. **`wolves-intro`** — the Destiny 2 guardian trailer with the six guardian
   nameplates. Plate CSS is byte-exact original (restored after an attempted
   font substitution); `leader: true` gilds Christoph Blecker's plate only.

Typography (intro only, by owner direction): **Michroma** for theater text
(the Microgramma/Eurostile Bold Extended stand-in from the Alien/Prometheus
universe) and **Share Tech Mono** for the caption backers, both self-hosted
via Fontsource. Michroma ships a single weight — never synthetic-bold it —
and renders roughly 30% wider than the previous stack, so cue font clamps
were rescaled to keep authored line breaks from double-wrapping. Periods and
commas are stripped from **displayed** intro text only (`stripIntroPunctuation`);
authored data keeps its punctuation.

Accent scheme: B/F letter highlights are always blue (the project is
BLUEfin). Dominant (POWERFUL) cues render in muted gold `#e6d5ae` with a soft
warm glow — the saturated leader-plate yellow proved too jarring at theater
scale. Captions use the plate blue for their edge so gold stays reserved for
power moments.

The overlay's old green debug scrubber and permanent progress bar were
deliberately deleted (marked temporary review tooling); transport lives in the
hero widget.

## 5. Ad resilience (design requirement)

There is no official ad-state API in the YouTube IFrame player and CORS
prevents inspecting the iframe DOM. The design therefore never trusts wall
clocks:

- Pre-roll ads: `getCurrentTime()` holds at 0 — synced content waits.
- Mid-roll ads: the main clock freezes — slideshow, ticker, thesis, captions,
  and widget all freeze identically and resume in perfect sync (verified by
  freezing the player and diffing all surfaces across a 3s window).
- The prologue's cues follow the audio embed's clock for the same reason.

This is also why Spotify was removed entirely: the Web Playback SDK requires
Premium (excludes viewers), its policy prohibits synchronizing recordings with
visual media, and it added an OAuth wall. YouTube embeds carry the soundtrack
for everyone, with ads simply pausing the show.

## 6. Hard-won engineering knowledge

Lessons that cost real debugging time tonight; check these before touching
related code.

- **CSS containing blocks vs `position: fixed`**: any ancestor `transform`
  (e.g. `translateZ(0)` GPU hints) rescopes fixed descendants. True fullscreen
  overlays inside the experience either teleport to `body` or rely on the
  stage being transform-free.
- **The shared site stylesheet leaks into this page**: `style/app/_topnavbar.scss`
  pads `body` by 60px (fixed with a `body:has(> #app > .wolves-cinematic)`
  override) and global `footer` element styles inflated a `<footer>` used in
  the lobby quote (use a `div`). Check computed styles on any new semantic
  element.
- **Vue scoped styles and the YT API**: `new YT.Player(el, ...)` *replaces*
  the host element with an iframe, so scoped selectors targeting the host's
  children never match; style the wrapper.
- **Component `<style>` blocks are plain CSS unless `lang="scss"`** — `//`
  comments break the build inside `WolvesIntroOverlay.vue`.
- **`loadVideoById`/`cueVideoById` accept `{ videoId, startSeconds }` objects**;
  the string form cannot express authored trims.
- **YouTube paints chrome (title, related videos, logo) on every paused
  embed** — `controls: 0` does not remove it. The stage's pause veil exists
  solely to mask this; the transparent shield blocks all pointer interaction
  with the iframe while playing.
- **tsconfig lib is ES2020**: no `Array.prototype.at`, no `String.replaceAll`.
- **`wallpapers-list.ts` is generated with double quotes** while lint wants
  single quotes; `npm run test:run` can regenerate it. Regenerate via
  `scripts/generate-wallpapers.js`, run `lint:fix`, and never hand-edit it.
  The generator indexes *everything* in the wallpaper folders — untracked
  images end up referenced by the committed manifest and break clean clones
  (this happened twice: `r2.png`, then `juju`/`walters`). Commit assets and
  manifest together, compressed (WebP for anything heavy).
- **Raw-imported data files must be tracked**: committed code importing
  `wolves-destiny-captions.txt?raw` while the file was untracked would have
  broken clean builds. After any commit that swept in pre-existing working
  tree changes, stash-verify that HEAD builds and tests standalone.
- **happy-dom + YT API testing**: fake players must fire `onReady`
  asynchronously (`queueMicrotask`) — synchronous fire hits the TDZ on the
  `const player` being constructed. Use
  `vi.useFakeTimers({ toFake: [... 'requestAnimationFrame', 'performance'] })`
  to drive rAF volume ramps deterministically.
- **Verify with the real player, not unit tests alone**: browser verification
  caught the prologue seek desync (seek didn't move the audio clock), the
  fade not restoring volume after seek-back, the scrim regression, and cue
  double-wrapping — none of which unit tests saw. Seek every changed
  timestamp on the live player before calling work done.

## 7. Content boundaries (unchanged from the original rules)

- Agents never write fiction, lore, cue copy, or titles; the owner authors all
  creative content. Timing/layout adjustments to authored cues (line-break
  rebalancing, duration extensions) happen only on explicit owner request.
- The three Track 0 content layers stay isolated: incoming-signal ticker
  (plate), thesis overlay text, and lore-column records never exchange text.
  (The plate's flip — signal line as the large label during 7 Days — is a
  presentation change within the ticker layer, not cross-layer routing.)
- Slideshow additions remain zero-code: drop compressed WebP into
  `public/img/wallpapers/wolves/{wolves,showcase,people}/` and regenerate.
  Locked Track 0 windows (Jono, Marina, and the Bluefin group) change only by
  owner request, with `wolves-track-zero-slides.ts`, the comic-reader
  boundary test, and a real-player seek as the verification trio.
- No emojis, no ellipses, no truncated content anywhere.

## 8. Deployment

GitHub Pages via the `Deploy to GitHub Pages` workflow on push to `main`.
A green build is not "live": confirm the workflow run for the exact pushed
SHA succeeds, then seek the affected timestamps on the production player.
The app is path-agnostic (`import.meta.env.BASE_URL` everywhere) and needs no
environment variables, API keys, or OAuth apps.
