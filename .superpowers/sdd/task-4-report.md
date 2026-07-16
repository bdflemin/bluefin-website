# Task 4: Spotify playback adapter evidence

## Scope

Implemented the injected, lazy Spotify Web Playback SDK adapter and connected it to
`WolvesSoundtrack` behind the existing `provider` selection boundary. The default
provider remains YouTube; no visual layout, markup, or YouTube behavior changed.

Spotify is rejected before SDK loading unless `validateSpotifyCatalog()` accepts the
loaded manifest against `wolvesSpotifyCatalog` and produces a non-empty ordered URI
list. The reviewed production catalog remains empty, so selecting Spotify currently
shows the controlled unavailable state and makes no Spotify SDK request.

## TDD evidence

1. Added `src/tests/useSpotifyPlayback.test.ts` before
   `src/composables/useSpotifyPlayback.ts`.
2. Ran the required red command:

   ```text
   npx vitest run src/tests/useSpotifyPlayback.test.ts
   Error: Failed to resolve import "../composables/useSpotifyPlayback"
   ```

3. Implemented the adapter and ran the focused green suite:

   ```text
   npx vitest run src/tests/useSpotifyPlayback.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
   Test Files  2 passed (2)
   Tests  7 passed (7)
   ```

The adapter tests inject SDK, player, fetch, clock, interval, and registered
callbacks. They cover exact transfer/start request ordering and device targeting,
100ms extrapolation without SDK polling, unknown URI failure and timer cleanup,
null state loss, account eligibility, not-ready events, and idempotent destruction
with late callbacks ignored.

`src/tests/wolvesSoundtrack.test.ts` received the same production-catalog
unavailability regression, while
`src/tests/wolvesSoundtrackSpotify.test.ts` runs that assertion with the dirty intro
module mocked so it can execute independently.

## Implementation evidence

- `useSpotifyPlayback()` loads the SDK only on `start()`.
- SDK `ready` supplies the device ID. The adapter then transfers with
  `{ device_ids: [deviceId], play: false }` before it starts
  `{ uris: trackUris }` on that same device. It never sends `context_uri`.
- Incoming SDK state is retained as a baseline. A 100ms timer emits only while the
  state is playing, extrapolating and clamping the position to its duration.
- `account_error` and `authentication_error` yield `ineligible`; API,
  initialization, playback, and device-not-ready failures are controlled errors.
- Unknown Spotify URIs are caught inside the event callback, transition to a
  controlled error, clear the timer, and discard stale progress.
- The soundtrack uses provider-neutral `setVolume()` for the existing Track 0 to
  Track 1 Creator Shorts handoff. The YouTube fade/pause/resume branch is unchanged.
- Spotify cleanup destroys its SDK device on component unmount; the existing
  deliberate YouTube HMR non-destruction remains unchanged.

## Validation

Passed:

```text
npx vitest run src/tests/useSpotifyPlayback.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
npx eslint src/composables/useSpotifyPlayback.ts src/tests/useSpotifyPlayback.test.ts src/components/wolves/WolvesSoundtrack.vue src/tests/wolvesSoundtrack.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
git diff --check
```

Blocked external to this task:

```text
npm run typecheck
src/data/wolves-intro-sequence.ts(361,79): error TS1002: Unterminated string literal.
```

The same user-owned parse error prevents the unmocked
`src/tests/wolvesSoundtrack.test.ts` suite from loading. The dirty
`src/data/wolves-intro-sequence.ts` and `public/dakota-versions.json` were inspected
and left untouched. No live Spotify calls were made.

## Commits

- `b58b031d839f7b0dae777517ffc82615b98c3881` —
  `feat(wolves): add Spotify playback adapter`
- `3bff65c` — `docs(wolves): document Spotify playback guardrails`

## Review follow-up: lifecycle, eligibility, and fade regressions

### TDD evidence

Focused regressions were added before production changes.

RED:

```text
npx vitest run src/tests/useSpotifyPlayback.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
Test Files  2 failed (2)
Tests  4 failed | 6 passed (10)
```

The failures showed an unmapped URI later returning to `playing`,
`authentication_error` classified as `account-ineligible`, playback starting after
`not_ready` during transfer, and the soundtrack displaying catalog-unavailable copy
for an account eligibility failure.

The 600ms handoff regression was then added and run before its implementation:

```text
npx vitest run src/tests/wolvesSoundtrackSpotify.test.ts
Test Files  1 failed (1)
Tests  2 failed | 1 passed (3)
```

It showed Spotify pausing immediately instead of after the 600ms fade.

GREEN:

```text
npx vitest run src/tests/useSpotifyPlayback.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
Test Files  2 passed (2)
Tests  11 passed (11)
```

### Fix evidence

- `account_error` remains `ineligible`; `authentication_error` is now a controlled
  `api-failed` error. The soundtrack keeps the former ineligible and displays the
  distinct Premium eligibility message. Catalog-unavailable copy is set only by
  catalog validation failure.
- Playback callbacks are generation-bound. `reportFailure()` marks that generation
  terminal, clears its clock, and blocks later state events. Startup checks terminal
  status after transfer before it may request play.
- Spotify now interpolates volume over the existing 600ms handoff interval. The
  fade-to-zero promise resolves before pause; resume occurs before the fade to 100.
  The existing YouTube fade helper and timing are unchanged.

### Follow-up validation

```text
npx eslint src/composables/useSpotifyPlayback.ts src/components/wolves/WolvesSoundtrack.vue src/tests/useSpotifyPlayback.test.ts src/tests/wolvesSoundtrackSpotify.test.ts
git diff --check
```

Both commands passed. The user-owned dirty `public/dakota-versions.json` and
`src/data/wolves-intro-sequence.ts` remain unstaged and untouched.
