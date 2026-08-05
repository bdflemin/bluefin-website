# Wolves Unified Status Timing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotate every non-locked Track 0 status entry once, in source order,
from 365s through 408s while preserving the thesis and Titanfall locks.

**Architecture:** Keep `TRACK_ZERO_LORE_PLAN` as the single authored editing
surface. Derive one ordered queue of its non-locked text entries without
deduplication, then have `getTrackZeroHudLabel()` use that queue only in the
365s-to-408s interval; all existing lock lookups continue to take precedence.

**Tech Stack:** TypeScript, Vitest

## Global Constraints

- Keep all five `TRACK_ZERO_LORE_PLAN` sections as the editing surface.
- Preserve every non-locked entry in source order, including duplicate text.
- Preserve all fixed status windows through `365s`.
- Rotate the combined non-locked entries from `365s` up to `408s`.
- Preserve `Bazzite Mk6 Units: Prepare for Titanfall` from `408s` through the
  existing video handoff.

---

### Task 1: Unify Track 0 Status Rotation

**Files:**
- Modify: `src/data/wolves-track-zero-manifest.ts:132-290`
- Modify: `src/tests/wolvesThesisSequence.test.ts:1-184`

**Interfaces:**
- Produces: `getTrackZeroRotatingStatusMessages(): readonly string[]`, an
  ordered, duplicate-preserving list of each non-locked text plan entry.
- Consumes: `TRACK_ZERO_LORE_PLAN`, `TRACK_ZERO_LOCKED_STATUSES`, and
  `getTrackZeroHudLabel(time: number): string`.

- [ ] **Step 1: Write the failing unified-queue tests**

Replace section-specific rotation expectations with a test that imports the
new queue function and checks the first, repeated, and final entries:

```ts
import { getTrackZeroRotatingStatusMessages } from '../data/wolves-track-zero-manifest'

it('queues every non-locked status in authored order, including repeats', () => {
  const messages = getTrackZeroRotatingStatusMessages()

  expect(messages.slice(0, 6)).toEqual([
    'Hikari Protocol: Initialized',
    'KDE Plasma Couplings: ENGAGED',
    'Mechaphippy Deployment: [UNAUTHORIZED]',
    'M2 Status: [ Unknown ]',
    'Field Medical Exoskeleton: [ Missing ]',
    'TARGET ACQUIRED: GOSPO, KYLE',
  ])
  expect(messages.filter(message => message === 'Software is Supposed to Die')).toHaveLength(3)
  expect(messages.at(-1)).toBe('The equation must be balanced, think like a dinosaur')
})
```

Update the HUD timing test to derive its duration from the unified queue:

```ts
const rotation = getTrackZeroRotatingStatusMessages()
const slotDuration = (408 - 365) / rotation.length

expect(getWolvesHudLabel(365)).toBe(rotation[0])
expect(getWolvesHudLabel(365 + slotDuration)).toBe(rotation[1])
expect(getWolvesHudLabel(407.999)).toBe(rotation.at(-1))
```

Keep the existing assertions for the 345s, 347.75s, 350.5s, 359s, 365s, and
408s lock boundaries. Replace assertions that expect section rotation before
365s with `DEFAULT_HUD_LABEL` outside those fixed lock windows.

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm run test:run -- src/tests/wolvesThesisSequence.test.ts
```

Expected: FAIL because `getTrackZeroRotatingStatusMessages` does not exist and
the current HUD scheduler rotates individual sections before 365s.

- [ ] **Step 3: Derive the duplicate-preserving queue and use it only after the thesis locks**

In `src/data/wolves-track-zero-manifest.ts`, add a queue derived directly from
the authored plan:

```ts
export function getTrackZeroRotatingStatusMessages(): readonly string[] {
  return Object.freeze(TRACK_ZERO_LORE_PLAN.flatMap(section =>
    section.entries.flatMap(entry =>
      'text' in entry && !entry.locked ? [entry.text] : [],
    ),
  ))
}
```

Replace the section-specific `pacedPlanMessage()` calls in
`getTrackZeroHudLabel()` with the unified interval:

```ts
if (time >= 365 && time < 408) {
  const messages = getTrackZeroRotatingStatusMessages()
  const slotDuration = (408 - 365) / messages.length
  return messages[Math.min(Math.floor((time - 365) / slotDuration), messages.length - 1)]
    ?? DEFAULT_HUD_LABEL
}
```

Retain the initial `TRACK_ZERO_LOCKED_STATUSES.find(...)` lookup unchanged so
all fixed windows still win. Remove the now-unused section-specific helpers
and branches, but retain source parsing exports used by other modules.

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npm run test:run -- src/tests/wolvesThesisSequence.test.ts
```

Expected: PASS. The queue retains all repeated entries, each entry occupies one
even slot in 365s-to-408s, and every fixed status boundary remains unchanged.

- [ ] **Step 5: Run type-checking**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/data/wolves-track-zero-manifest.ts src/tests/wolvesThesisSequence.test.ts docs/superpowers/plans/2026-08-05-wolves-unified-status-timing.md
git commit -m "fix(wolves): unify status rotation" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```
