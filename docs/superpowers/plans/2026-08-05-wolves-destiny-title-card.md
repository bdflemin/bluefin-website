# Wolves Destiny Title Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the Destiny title-card artwork and QR, enlarge the QR code,
move the Amber Graner quote into an unboxed bottom band, and replace the
supplied status line.

**Architecture:** Keep the authored status in `WolvesApp.vue`; retain all title-card markup and assets in `WolvesIntroOverlay.vue`. Adjust only the existing title-card CSS and update its deterministic unit and browser assertions.

**Tech Stack:** Vue 3, TypeScript, scoped CSS, Vitest, Playwright.

## Global Constraints

- Preserve the MakeMeAComic URL, QR asset, accessible label and alt text.
- Preserve the Amber Graner quote and attribution exactly.
- Preserve title-card timing and hero-art rotation.
- Use no new assets, prose, controls, or navigation.

---

### Task 1: Revise the Destiny title card

**Files:**
- Modify: `src/WolvesApp.vue`
- Modify: `src/components/wolves/WolvesIntroOverlay.vue`
- Modify: `src/tests/wolvesApp.test.ts`
- Modify: `src/tests/wolvesIntroOverlay.test.ts`
- Modify: `tests/wolves-intro-destiny-toggle.mjs`
- Modify: `tests/wolves-intro-segments.mjs`
- Modify: `tests/wolves-movie-flow.mjs`

**Interfaces:**
- Consumes: `INTRO_DISPLAY['wolves-intro'].title`, `activeComicTitleCardCue`, and the existing QR/quote data attributes.
- Produces: a centered title-card composition with measurable non-overlapping
  artwork, QR, bottom quote, and widget bounds.

- [ ] **Step 1: Write the failing regression expectations**

Change the title expectation to `a project to bring their stories to life`. In
the title-card browser helper, require a 300px QR image, artwork left of the
QR, and a centered freeform quote along the bottom above the widget.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `npm run test:run -- src/tests/wolvesApp.test.ts src/tests/wolvesIntroOverlay.test.ts`

Expected: the status expectation and restored QR/quote rendering expectation
fail before the implementation.

- [ ] **Step 3: Implement the minimal layout and content revision**

Set `INTRO_DISPLAY['wolves-intro'].title` to the supplied exact text and remove
that phrase from the title-card cue. Use the existing title-card grid for a
centered dinosaur/QR pair with a 28rem QR frame. Remove all panel paint from
`.wolves-intro-overlay-title-card-amber-quote`; pin it as centered bottom-band
text above the media widget.

- [ ] **Step 4: Run focused regression checks**

Run: `npm run test:run -- src/tests/wolvesApp.test.ts src/tests/wolvesIntroOverlay.test.ts && node tests/wolves-intro-destiny-toggle.mjs && node tests/wolves-intro-segments.mjs && node tests/wolves-movie-flow.mjs`

Expected: all status, cue rendering, desktop, and narrow layout assertions
pass.

- [ ] **Step 5: Commit**

```bash
git add src/WolvesApp.vue src/components/wolves/WolvesIntroOverlay.vue src/tests/wolvesApp.test.ts src/tests/wolvesIntroOverlay.test.ts tests/wolves-intro-destiny-toggle.mjs tests/wolves-intro-segments.mjs tests/wolves-movie-flow.mjs docs/superpowers/specs/2026-08-05-wolves-destiny-title-card-design.md docs/superpowers/plans/2026-08-05-wolves-destiny-title-card.md docs/skills/design-gate/SKILL.md
git commit -m "fix(wolves): refine Destiny title card"
```
