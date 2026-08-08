# Wolves transport and clocks

**Agents edit content. Agents never edit design.**

Defect-derived invariants for the Wolves dual-buffer player, the transport
clock, and the mapping between segment indices and playlist tracks. Every rule
here was learned from a defect that reached a theater build.

Procedure and approval gate: [`../skills/wolves-runtime-engineering/SKILL.md`](../skills/wolves-runtime-engineering/SKILL.md).
Show-wide production facts: [`wolves-runtime.md`](wolves-runtime.md).

## Transports and clocks

Three invariants, each learned from a defect that reached the theater build.

**A prewarmed buffer must be parked, and promoted by seek.** `cueNext()` starts
the inactive buffer to force YouTube to buffer, but an unparked buffer keeps
playing silently underneath the current segment for its entire duration. When
the next segment is longer than the current one it is already minutes in by the
time it is heard, and the audience loses the opening of the song. Park on the
`PLAYING` state change (pause, seek to opening frame, volume 0) *before* any
`side !== activeSide` early return, and have promotion seek to the opening frame
rather than trusting where the buffer happens to sit. The seek is the guarantee;
parking is the optimisation. This also drove a phantom "progress bar snapping"
report — one root cause, two symptoms, because the elapsed time published on the
first poll after the swap was whatever the runaway buffer had reached.

**Lead a crossfade by the whole fade, not by a threshold.** If the swap fires
`PRE_END_THRESHOLD_S` before the end but the ramp runs `crossfadeMs`, the
outgoing track reaches its real end while the incoming is barely up, and the
room gets a hole in the music. Lead by `PRE_END_THRESHOLD_S + crossfadeMs/1000`.
Do not pause the outgoing side early — let it play out under the fade, or the
last bars of the song are lost. Ramp on an equal-power sin/cos curve: two linear
ramps sum to a dip in perceived loudness at the midpoint.

**Derive elapsed from an origin; never accumulate.** A silent card with no
player to read still needs a clock. `currentTime += 0.2` on a 100ms interval ran
every silent card at double speed. Accumulating a measured delta fixes the speed
but still drifts, and lands on float error exactly at the boundary (ten `+= 0.1`
sum to 0.9999999999999999, so a card never reaches its own duration). Keep an
origin timestamp and compute `(performance.now() - origin) / 1000`. Pause by
trailing the origin; seek by rebasing it. This is the same principle as "every
lore view is a pure function of `elapsed`", applied to the one surface that has
to source the elapsed value.

**Fade the transport that is actually playing, not the one the fade was written
for.** The intro's authored `audioFadeOutSeconds` lives in `startTextSegment()`
and only touches `audioPlayer`, but the final intro segment is the Destiny
trailer — a `video` segment on the main `player`. So the trailer's audio was
severed dead by `destroyPlayer()` in the `done` watcher exactly as Track 0 came
up at full volume: hard cut, hole, slam. `WolvesIntroOverlay.vue` now ramps the
video player over `VIDEO_HANDOFF_FADE_SECONDS` on an equal-power cosine taper,
led from the 200 ms poll loop across the *final* segment's own closing seconds
(recomputed each tick, so seeking back out of the window restores full volume),
with a completion-time ramp covering every path that skips the lead fade — early
`ENDED`, `onError`, Skip, presenter Next. **Never delay `emit('complete')` for
it.** `handleIntroComplete()` awaits `stage.start()`, which awaits Track 0's
`PLAYING`, and the overlay is held opaque until that resolves; serialising the
ramp ahead of the emit lengthens the very gap the fade exists to close. Start
the ramp, emit, destroy on landing, and guard the ramp against unmount and a
re-entrant `done` by comparing the captured player against the live one.

**Both buffers prewarm, and startup waits for the active side's park.** Gating
the prewarm on `side !== activeSide` left Track 0 — the first thing the audience
hears — as the only buffer that ever entered cold, while a track needed seven
minutes later was buffered eagerly. The trailer's audio stopped and the room sat
in silence on a black overlay. Prewarm both sides, then have `start()` await the
active side's park before it raises the volume: a park that lands *after*
startup pauses the show and sets volume 0. Promote the parked buffer with
`startIncoming()` (seek to the authored opening frame, then play) instead of a
cold `loadVideoById`; the seek, not the load, is what makes album entry
deterministic. Clear the side's `prewarming` flag at startup as a second guard,
and keep the hard-load path for when no park landed in time.

**The fade for a boundary belongs to the INCOMING segment.** It is authored on
the same config record as `transitionLore`, which is per-incoming. Reading it
from the outgoing segment shifts every fade one boundary earlier and makes the
last segment's `crossfadeMs` dead config that can never be applied. Derive the
lead in `pollActiveTime()` and the ramp in `beginSwap()`/`skip()` from one
helper taking the target index, or the two drift apart again.

**Publish the outgoing clock for the whole swap.** Suppressing `updateTime()`
while `swapping` freezes the transport bar for up to 2.5s and then snaps it to
zero at `advanceSegment()`. Do not simply drop the guard: `activeSide` has
already flipped to the incoming buffer while `store.segmentIndex` still names
the outgoing segment, so reading the active side publishes the new track's
position against the old segment's identity. Hold a reference to the outgoing
side for the duration of the swap and read that.

**Bound every await that the show depends on.** `start()` awaiting `PLAYING`
with no timeout hangs the presentation on a black frame with nobody in the
booth. Bound it, fall back to pushing play and opening the poll loop, and clear
the timer on both normal resolution and `destroy()`.

**A player test double must have a running clock.** These defects were invisible
for the same reason: `FakePlayer.currentTime` only moved on `loadVideoById`, so
a runaway buffer's clock was frozen at 0 forever and every timing assertion was
vacuously true. Model the transport honestly — `tickClock()` advancing time and
firing `ENDED` at the boundary, `seekTo()`, and `playVideo()` restarting a
finished video from 0 the way YouTube does — and drive timers and player clocks
together from one helper. Fixing the double is what makes the runtime fixes
provable; do it first. See `src/tests/wolvesDualBufferPlayer.test.ts`.

The same blind spot existed in the browser mock, so there is now a runtime
harness that runs the clock against the real route, started against a dev server
on 127.0.0.1:5173: `node tests/wolves-buffer-parking.mjs`. It fails on a build
with an unparked prewarm buffer (both buffers `PLAYING`, both clocks in lockstep)
and passes when one is parked at `currentTime` 0 with volume 0. Two things to
know before writing another harness like it: `window.__wolvesDurations.skipIntro()`
is async, so returning its promise from `page.evaluate()` hangs the run, and
`window.__wolvesCinematic` never appears under a mocked player, so assert against
`window.__mockWolvesPlayers` instead of waiting for that hook.

**Every await on the way to first audio must be bounded, including the ones you
did not write.** `start()` carried a timeout on the `PLAYING` transition and was
still able to hang the show forever, because it did `await prepare()` first and
`prepare()` awaits `loadYoutubeIframeApi()` and player `onReady` — both unbounded.
`handleIntroComplete()` awaits `start()` and holds the intro overlay opaque until
it returns, so a stalled YouTube script is a permanent black screen in front of
the audience. Bound the *whole* prepare-and-start path, and on expiry tear down
partial players **and** invalidate the cached API-load promise
(`invalidateYoutubeIframeApiLoad()`): a retry that reuses a promise which never
settled cannot recover. A rejected prepare needs the same treatment as a timed-out
one — an exception thrown past `start()` is the same hang.

**A prewarm is an optimisation and must never become a gate.** Awaiting the active
side's park before requesting playback turned a *failed* prewarm into guaranteed
dead air: the show waited out the settle timeout before it even asked to play,
while the intro was already fading its audio out underneath. Let the prewarm settle
during the intro, where there are minutes of runway. At the handoff read the parked
flag once — parked, promote by seek; not parked, clear `prewarming` and play
immediately. Never wait.

**A cold skip must not fade out a transport that is working.** The warm path
promotes an already-parked buffer and can swap synchronously. The cold path
(backward or multi-segment jumps) hard-loads, so switching sides and ramping
before the incoming reports `PLAYING` fades a good player toward a black one. Hold
the outgoing side until the incoming plays, bounded, and size that bound against
the transition overlay's hold — the overlay is the only cover, and its hold is now
derived from the crossfade rather than a fixed 11 s, so it is much shorter than it
used to be.

## Segment index is not a playlist track index

`CINEMATIC_SEGMENTS` (`src/config/wolves-cinematic.ts`) is a **curated six-item
subset** of the seven authored tracks in `public/wolves-playlist.json`. Playlist
track 4, "End of You", is deliberately omitted. From segment index 4 onward the
two orderings diverge: segment 4 is playlist track 5 (Soulbound), segment 5 is
playlist track 6 (Last Ride of the Day).

`CINEMATIC_AUTHORED_DURATIONS` in `src/stores/cinematic.ts` was built by taking
the first six playlist durations, so Parts V and VI carried the wrong runtimes
(193/234 instead of 234/271). Because `authoredSequenceElapsed()` **clamps**
`segmentElapsed` to the authored value, the transport's TOTAL readout froze for
the last 41 s of Part V and the last 37 s of the finale, and overall duration
under-reported by 78 s. This shape of bug has now occurred three times.

Rules:

- Never slice the playlist to build per-segment data. Read the ids out of
  `CINEMATIC_SEGMENTS` in order and measure those:
  `yt-dlp --skip-download --print "%(duration)s" <id> ...`.
- Durations are **measured**, never rounded guesses. A suspiciously round number
  is an authored guess; record the measuring command next to the data.
- One elapsed-time source. `advanceSegment()` used to accrue `completedElapsed`
  from the *player-reported* duration while `sequenceElapsed` summed the
  *authored* timeline, so the two readouts could disagree mid-show. Both now
  read `CINEMATIC_TIMELINE`.
- Guard the alignment in a test, not by eye: assert the authored duration array
  matches `CINEMATIC_SEGMENTS` by length and by id/`youtubeId` order, and that
  no omitted track's runtime appears in it.

## A segment index is not a playlist track index

`CINEMATIC_SEGMENTS` is a curated six-item subset of the seven authored tracks
in `public/wolves-playlist.json`: the show omits playlist track 4, **End of
You**. So `segmentIndex` and playlist index agree only through 3, and diverge by
one from 4 on (segment 4 = Soulbound, segment 5 = Last Ride of the Day). The
same trap is already documented on `SEGMENT_DURATIONS_SECONDS` in
`src/stores/cinematic.ts`; it has now bitten `WolvesComicReader.vue` too, which
read `manifest.tracks[props.trackIndex]` and paced the 174 BPM finale on
Soulbound's 124 BPM grid with the wrong crossfade.

The rule: **anything that reaches into the playlist resolves by identity.**
`TheaterExperience.vue` passes `:track-id="store.segment.youtubeId"` and the
reader matches on `youtubeVideoId`/`id`. Identity resolution is confined to the
Wolves experience on purpose — catalogue albums in
`public/experiences/catalogue.json` share youtube ids with unrelated entries
further down the same playlist, so for them the index *is* the addressing
scheme. `trackIndex` keeps driving ordering and branching (`trackIndex === 0`,
`trackIndex > 0`, shuffle partitioning); only the metadata lookup changed.
