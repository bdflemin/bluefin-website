# Wolves Chat Timing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep chatlogs readable through fast Track 0 music and slideshow slots.

**Architecture:** `TheaterExperience` holds an active chatlog artifact while
`WolvesLoreColumn` reports its completion. The active slot resumes from the
current player-clock record after completion, so expired records are not
replayed.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, Vue Test Utils

## Global Constraints

- Preserve the Golden Era/Sarah chat cadence.
- Do not create a second clock; use the cinematic store's native player time.
- Do not replay expired narrative records after a chat completes.

---

### Task 1: Hold an active chatlog across short timeline slots

**Files:**
- Modify: `src/components/wolves/lore/ChatlogLoreView.vue`
- Modify: `src/components/wolves/WolvesLoreColumn.vue`
- Modify: `src/components/wolves/cinematic/TheaterExperience.vue`
- Test: `src/tests/wolvesLoreColumn.test.ts`

**Interfaces:**
- Produces: `chat-started` and `chat-complete` events from the chatlog view,
  forwarded by `WolvesLoreColumn`.
- Consumes: the current `narrativeSlot` in `TheaterExperience`.

- [ ] **Step 1: Write the failing integration test**

Mount the theater with a chatlog record, advance its player-clock target to a
later non-chat record, and assert the original chat remains selected until
`chat-complete` is emitted.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:run -- src/tests/wolvesLoreColumn.test.ts`

Expected: FAIL because a changing narrative slot replaces the chat immediately.

- [ ] **Step 3: Implement the hold and release protocol**

Emit `chat-started` when `ChatlogLoreView` begins a record and `chat-complete`
when it finishes. Forward those events through `WolvesLoreColumn`. In
`TheaterExperience`, retain the slot that began the active chat; on completion,
replace it with the latest `narrativeSlot`.

- [ ] **Step 4: Run focused tests**

Run: `npm run test:run -- src/tests/wolvesLoreColumn.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/wolves/lore/ChatlogLoreView.vue src/components/wolves/WolvesLoreColumn.vue src/components/wolves/cinematic/TheaterExperience.vue src/tests/wolvesLoreColumn.test.ts
git commit -m "fix(wolves): hold chats through fast slots"
```
