# Wolves Lobby Draft Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Wolves entry CTA visibly actionable while presenting funding
and maintainer nomination surfaces as unavailable draft features.

**Architecture:** Keep lobby behavior in `CinematicLobby.vue` and gallery
content in `WolvesCharacterGallery.vue`. Replace external donation anchors and
QR cards with native disabled buttons and static placeholder cards, preserving
the existing gallery layout and event interface.

**Tech Stack:** Vue 3, TypeScript, SCSS, Vitest, Vue Test Utils

## Global Constraints

- Preserve the primary CTA label, click event, placement, and responsive sizing.
- Do not add an external destination for donations or maintainer nominations.
- Remove Project Bluefin donation and store QR-code images from the gallery.
- Mark all unavailable funding and nomination actions `COMING SOON`.
- Preserve keyboard focus for enabled entry controls; unavailable controls must
  use native disabled semantics.

---

### Task 1: Test the lobby CTA visual contract

**Files:**
- Modify: `src/tests/wolvesCinematicLobby.test.ts`
- Modify: `src/components/wolves/cinematic/CinematicLobby.vue:56-70,275-297`

**Interfaces:**
- Consumes: `CinematicLobby` emitting `enter`.
- Produces: `.wc-lobby-enter` and `.wc-waypoint-enter` classes whose rest state
  is a gold-filled, high-contrast call to action.

- [ ] **Step 1: Write the failing test**

```ts
it('renders both teammate entry controls as filled primary CTAs', () => {
  const wrapper = mount(CinematicLobby)

  expect(wrapper.get('.wc-lobby-enter').classes()).toContain('wc-cta--primary')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/tests/wolvesCinematicLobby.test.ts`

Expected: FAIL because `wc-cta--primary` is not present.

- [ ] **Step 3: Write minimal implementation**

```vue
<button class="wc-lobby-enter wc-cta--primary wc-plate" type="button">
  MEET YOUR TEAMMATES
</button>
```

```scss
.wc-cta--primary {
  background: var(--wc-gold);
  color: var(--wc-bg);
}
```

Apply the shared class to the fixed waypoint entry button and preserve its
existing hover and `:focus-visible` rules.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/tests/wolvesCinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/cinematic/CinematicLobby.vue src/tests/wolvesCinematicLobby.test.ts
git commit -m "feat(wolves): emphasize teammate entry CTA"
```

### Task 2: Replace live donation and QR surfaces with draft placeholders

**Files:**
- Modify: `src/components/wolves/WolvesCharacterGallery.vue:1-323`
- Modify: `src/tests/cinematicLobby.test.ts`

**Interfaces:**
- Consumes: rendered guardian cards and donation-tier data local to
  `WolvesCharacterGallery.vue`.
- Produces: disabled `.wc-character-card-donate` buttons labelled
  `COMING SOON`, and two static `.wc-character-card--upcoming` placeholders:
  one unnamed future guardian and one `NOMINATE A MAINTAINER`.

- [ ] **Step 1: Write the failing test**

```ts
it('shows draft-only guardian funding and nomination controls', () => {
  const wrapper = mount(CinematicLobby)

  expect(wrapper.findAll('img[alt*="QR code"]')).toHaveLength(0)
  expect(wrapper.findAll('a[href*="sponsors"], a[href*="store"]')).toHaveLength(0)
  expect(wrapper.get('.wc-character-card--nominate').text()).toContain('NOMINATE A MAINTAINER')
  expect(wrapper.findAll('button.wc-character-card-donate:disabled').length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: FAIL because QR code images and live donation links are still present.

- [ ] **Step 3: Write minimal implementation**

```vue
<button class="wc-character-card-donate" type="button" disabled>
  COMING SOON
</button>

<article class="wc-character-card wc-character-card--upcoming wc-character-card--nominate wc-plate">
  <div class="wc-character-card-art wc-character-card-art--pending" aria-hidden="true" />
  <span class="wc-character-card-name">NOMINATE A MAINTAINER</span>
  <span class="wc-character-card-sub">COMING SOON</span>
</article>
```

Remove the QR image imports, QR-card markup, and external donation/store
anchors. Replace each guardian and tier donation anchor with the disabled
button. Use the existing pending-card styles for the new blank cards and add
only the selector needed for the nomination placeholder.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/WolvesCharacterGallery.vue src/tests/cinematicLobby.test.ts
git commit -m "feat(wolves): mark gallery funding as coming soon"
```

### Task 3: Validate the scoped lobby behavior

**Files:**
- Verify: `src/components/wolves/cinematic/CinematicLobby.vue`
- Verify: `src/components/wolves/WolvesCharacterGallery.vue`
- Verify: `src/tests/wolvesCinematicLobby.test.ts`
- Verify: `src/tests/cinematicLobby.test.ts`

**Interfaces:**
- Consumes: the completed lobby and gallery components.
- Produces: a verified desktop and mobile Wolves lobby with only the entry
  controls interactive.

- [ ] **Step 1: Run focused tests**

Run: `npm run test:run -- src/tests/wolvesCinematicLobby.test.ts src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the type check**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Exercise the Wolves route**

Run: `npm run dev -- --host 0.0.0.0`

Open `/wolves/` at desktop and 640px mobile widths. Confirm the gold entry CTA
and fixed waypoint CTA are readable, donation and nomination controls are
visibly unavailable, and neither QR image is rendered.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/cinematic/CinematicLobby.vue src/components/wolves/WolvesCharacterGallery.vue src/tests/wolvesCinematicLobby.test.ts src/tests/cinematicLobby.test.ts
git commit -m "test(wolves): cover lobby draft controls"
```

### Task 4: Center constrained gallery support copy

**Files:**
- Modify: `src/components/wolves/WolvesCharacterGallery.vue:333-340`

**Interfaces:**
- Consumes: `.wc-character-gallery` as a column flex container.
- Produces: `.wc-character-gallery-intro` as a centered, 64-character-wide
  support-copy block.

- [ ] **Step 1: Add the alignment declarations**

```scss
.wc-character-gallery-intro {
  align-self: center;
  text-align: center;
}
```

Keep the existing `max-width: 64ch` and typography declarations unchanged.

- [ ] **Step 2: Verify the Wolves route**

Run: `curl --fail --silent http://localhost:5173/wolves/ -o /var/tmp/website-agent/wolves.html`

At desktop and 640px mobile widths, confirm both maintainer-support paragraphs
are centered as constrained text blocks and remain readable.

- [ ] **Step 3: Run the focused lobby test**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check -- src/components/wolves/WolvesCharacterGallery.vue`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/WolvesCharacterGallery.vue
git commit -m "fix(wolves): center gallery support copy"
```

### Task 5: Unify gallery editorial-copy alignment

**Files:**
- Modify: `src/components/wolves/WolvesCharacterGallery.vue:320-340`

**Interfaces:**
- Consumes: the gallery's existing flex-column layout.
- Produces: a shared centered rule for `.wc-character-gallery-rally` and
  `.wc-character-gallery-intro`, while cards and quote content remain
  left-aligned.

- [ ] **Step 1: Consolidate the editorial alignment rule**

```scss
.wc-character-gallery-rally,
.wc-character-gallery-intro {
  align-self: center;
  text-align: center;
}
```

Leave `.wc-character-card`, `.wc-character-tier`, `.wc-character-incoming-item`,
and `.wc-lobby-quote` unchanged because their left-aligned text supports
scanning and readable long-form copy.

- [ ] **Step 2: Verify the Wolves route**

Run: `curl --fail --silent http://localhost:5173/wolves/ -o /var/tmp/website-agent/wolves.html`

At desktop and 640px mobile widths, confirm the rally and support paragraphs
share a centered axis, while card and quote content preserve their left edge.

- [ ] **Step 3: Run the focused lobby test**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check -- src/components/wolves/WolvesCharacterGallery.vue`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/WolvesCharacterGallery.vue
git commit -m "fix(wolves): unify gallery copy alignment"
```

### Task 6: Add a prominent entry play glyph

**Files:**
- Modify: `src/components/wolves/cinematic/CinematicLobby.vue:34-70,175-210`
- Modify: `src/tests/cinematicLobby.test.ts`

**Interfaces:**
- Consumes: `CinematicLobby` emitting `enter`.
- Produces: `.wc-cta-icon` as a decorative, aria-hidden play glyph before the
  unchanged `MEET YOUR TEAMMATES` label in both entry controls.

- [ ] **Step 1: Write the failing test**

```ts
expect(wrapper.get('.wc-lobby-enter .wc-cta-icon').attributes('aria-hidden')).toBe('true')
expect(wrapper.get('.wc-lobby-enter').text()).toContain('MEET YOUR TEAMMATES')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: FAIL because the CTA has no `.wc-cta-icon`.

- [ ] **Step 3: Add the decorative glyph**

```vue
<span class="wc-cta-icon" aria-hidden="true">▶</span>
MEET YOUR TEAMMATES
```

Apply the same markup to the waypoint CTA. Use a fixed square, dark glyph
container against the existing gold CTA background; do not change the button
label, click event, or button semantics.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/cinematic/CinematicLobby.vue src/tests/cinematicLobby.test.ts
git commit -m "feat(wolves): add entry command glyph"
```

### Task 7: Add entry instruction copy

**Files:**
- Modify: `src/components/wolves/cinematic/CinematicLobby.vue:34-70,175-210`
- Modify: `src/tests/cinematicLobby.test.ts`

**Interfaces:**
- Consumes: the hero and waypoint `enter` buttons.
- Produces: `.wc-cta-instruction` small copy directly above each button and
  the exact shared label `Meet your Teammates`.

- [ ] **Step 1: Write the failing test**

```ts
expect(wrapper.get('.wc-cta-instruction').text()).toBe('Click to begin the Wolves Experience')
expect(wrapper.get('.wc-lobby-enter').text()).toContain('Meet your Teammates')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: FAIL because the instruction is absent and the button still uses its
previous label.

- [ ] **Step 3: Add the instruction and update both labels**

```vue
<p class="wc-cta-instruction">Click to begin the Wolves Experience</p>
```

Wrap each instruction and button in an existing-structure-neutral container
only when needed to keep the instruction directly above its control. Use the
existing mono label styling and keep click handlers unchanged.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/tests/cinematicLobby.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/cinematic/CinematicLobby.vue src/tests/cinematicLobby.test.ts
git commit -m "feat(wolves): clarify entry action"
```
