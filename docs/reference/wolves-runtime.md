# Wolves runtime reference

**Agents edit content. Agents never edit design.**

## Boundary

The `/wolves/` experience has a frozen design. Agents may edit only authored
prose, data values, registered records, and approved assets within existing
structures. Do not edit Vue templates, styles, layout, controls, animation,
player synchronization, or generated files for content work.

## Runtime owners

- Entry: `wolves/index.html`
- Mount: `src/wolves-main.ts` and `src/WolvesApp.vue`
- State: `src/stores/cinematic.ts`
- Intro data: `src/data/wolves-intro-sequence.ts`
- Segment data: `src/config/wolves-cinematic.ts`
- Player buffers: `src/composables/useDualBufferPlayer.ts`
- Content procedures: `docs/skills/wolves-content/SKILL.md`

## Open content surfaces

- Lore: `src/data/lore/*.md` plus a manifest entry in
  `src/data/wolves-lore-records.ts`. These are coupled records: when deleting a
  lore file, remove its manifest entry and any
  `src/data/wolves-narrative-timeline.ts` artifact entry in the same change, or
  route initialization will fail.
- Incoming signals: `src/data/wolves-incoming-signal.txt`.
- Dinosaur registry: `src/data/wolves-dinosaur-species.ts`.
- Guardian bond data: `src/data/wolves-guardian-dinosaur-bonds.ts`.
- Intro cue data: `buildIntroVideoSequence()` (standard intro) and `buildDirectorsCutVideoSequence()` (Director's Cut with Gayane Ballet Suite prologue + Destiny 2 trailer) in `src/data/wolves-intro-sequence.ts`. The Director's Cut option is available at the bottom of the `/wolves/` page. The standard intro's comic title-card slot uses the approved project copy, restores the MakeMeAComic QR code, and places the recovered Amber Graner quote at the bottom. Its music widget auto-hides during inactivity and reappears on pointer, touch, or keyboard interaction.
- Soundtrack source data: `public/wolves-playlist.json` and its updater.
- Back catalogue: source playlist metadata and
  `scripts/update-back-catalogue.js`.
- Wallpaper content: `public/img/wallpapers/wolves/` and curated values in the
  generator.

Use exact user-supplied or recovered authored copy. Never invent lore, dialogue,
quotes, names, scientific facts, pairings, or provenance.

## Locked layers

Keep incoming signals, thesis data, lore records, and later-track chat data in
their existing layers. `src/data/wolves-thesis-sequence.ts` and
`src/data/wolves-narrative-timeline.ts` are locked authored data unless the user
explicitly authorizes a timing change.

## Generated files

Never hand-edit:

- `src/components/wolves/wallpapers-list.ts`
- `public/experiences/catalogue.json`
- generated artwork under `public/experiences/`

Change source inputs and run the owning generator.

## Verification

Run the relevant typecheck, tests, and build. For intro, soundtrack, slideshow,
timeline, or player-synchronized content, verify the affected timestamps with the
Wolves browser flow and real player. For lore deletions, open `/wolves/` in
Chromium and assert the page has rendered text with no `pageerror` events; a
successful build does not prove eager lore loading succeeds. Finish with
`docs/skills/validation/SKILL.md` before any production claim.

## Timing and readability lessons

- Wolves is a passive video presentation. Do not require, offer, or depend on
  pointer, click, touch, keyboard, or scrolling interaction to follow its
  narrative text. The renderer must pace and reveal the complete story itself.
- Use a noninteractive paged renderer for chatlogs and quotes: show one
  complete sentence- or word-bounded readable beat, retain the speaker header
  on continued chat beats, then automatically type, hold, and replace it.
  Never accumulate important text behind an overflow viewport.
- Every Wolves presentation image is single-use. Do not schedule duplicate
  assets in Track 0 or repeat a Track 0 image in carry-forward tracks.
- The 5:55 finale barrage consumes distinct contributor photos on each measured
  music beat through the legend cue. Use the live CNCF feed when it provides
  enough unique images; retain deterministic local fallback timing otherwise.
- Across Track 0 and later tracks, every unique local or CNCF feed image has
  one placement only. The final barrage consumes its assigned feed images;
  remaining unique images carry forward to later tracks without reuse.
- The active media-player clock remains the only synchronization clock.
- A chat completion event may hold its active record on screen, but it is a
  display lifecycle gate, not a second clock: when it releases, resume from
  the latest player-clock record without replaying elapsed content.
- Typewriter cadence must not compress to fit a short timeline slot; an active
  chat holds until its normal cadence and final reading pause complete.
- Preserve locked narrative anchors exactly and allocate only unlocked intervals.
- Use invariant tests for recomputed intervals: completeness, uniqueness, ordering, contiguity, anchor preservation, and readability minimums.
- Do not call an abandoned experiment restored. State which source is active and what was actually changed.
- For accessibility, expose complete active lore text at the article level; do not announce every typed character through a live region.
- Verify short and long records in Chromium, not only with unit tests or a build.
