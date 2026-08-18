# Wolves Teaser Bridge Occlusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent post-cut YouTube frames from appearing while Trailer 1 fades from black into the March wolf-day wallpaper.

**Architecture:** Preserve the existing three-picture timeline and YouTube transport. Keep the bridge container as an opaque black occlusion layer, and preserve the authored fade on a nested wallpaper group so its day/night composition fades over black.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, Playwright/Chromium, SCSS.

## Global Constraints

- The YouTube picture ends at exactly 88.2 seconds and never returns.
- Do not change authored timing, copy, transport, fullscreen behavior, or layout.
- Write and observe the regression test failing before changing production code.
- Preserve the unrelated `public/dakota-versions.json` edit in the primary worktree.

---

### Task 1: Occlude the YouTube picture at the bridge boundary

**Files:**
- Create: `src/tests/wolvesTeaserApp.test.ts`
- Modify: `src/WolvesTeaserApp.vue`
- Modify: `docs/skills/wolves-teaser/SKILL.md`

**Interfaces:**
- Consumes: `window.__wolvesTeaser.seekTo(seconds)`, `trailerBridgeState(time)`, `.wt-backdrop`, `.wt-backdrop-images`, and `.wt-backdrop-img`.
- Produces: an opaque bridge backing with a nested wallpaper group that preserves the authored day/night blend.

- [x] **Step 1: Write the failing component test**

Mock `useYoutubeIframeApi`, mount `WolvesTeaserApp`, and seek through the opening, day/night turn, and closing fade with `window.__wolvesTeaser`. Assert that the bridge backing stays opaque, the wallpaper group follows `bridge.opacity`, and the night image independently follows `bridge.nightMix`.

- [x] **Step 2: Run the test and verify RED**

Run: `npx vitest run src/tests/wolvesTeaserApp.test.ts`

Expected: FAIL at 88.2 seconds because `.wt-backdrop` currently has `opacity: 0` and the day image has no independent opacity.

- [x] **Step 3: Implement the minimal rendering fix**

Remove the inline opacity from `.wt-backdrop`. Wrap both images in `.wt-backdrop-images`, apply `segment === 'bridge' ? bridge.opacity : 1` to that group, and keep `segment === 'bridge' ? bridge.nightMix : 1` on the night image.

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `npx vitest run src/tests/wolvesTeaserApp.test.ts src/tests/wolvesTrailerPlates.test.ts src/tests/wolvesMediaWidget.test.ts`

Expected: all tests pass.

- [x] **Step 5: Record the defect-derived invariant**

Update `docs/skills/wolves-teaser/SKILL.md` to state that bridge darkness belongs to the wallpaper images over an always-opaque black backing; fading the whole backdrop exposes post-cut YouTube frames.

- [x] **Step 6: Validate rendered behavior**

Serve the worktree with one Vite process. In Chromium at 1280×720 and 390×844, inspect the cut, opening rise, day/night turn, and closing fade. Require an opaque backing after 88.2 seconds, the authored group/night opacities, no page errors, no failed local requests, and no horizontal overflow.

- [x] **Step 7: Run repository checks**

Run: `npm run lint`, `npm run typecheck`, `npm run test:gate`, `npm run build`, and `git diff --check`.

- [x] **Step 8: Commit the complete fix**

Stage only the design, plan, component, test, and owning skill. Commit with Conventional Commits and both required attribution trailers.
