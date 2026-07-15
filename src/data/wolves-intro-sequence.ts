/**
 * Pure sequencing logic for the Wolves "Start Experience" intro video overlay.
 *
 * Kept separate from the Vue component so the state machine (advance / skip / overlay text
 * lookup) can be unit tested without needing real <video> playback, which jsdom does not
 * support.
 */

export interface IntroOverlayTextCue {
  readonly text: string
  readonly start: number
  readonly end: number
}

export interface IntroVideoSpec {
  readonly id: string
  readonly src: string
  readonly overlays?: readonly IntroOverlayTextCue[]
}

export interface IntroSequenceState {
  readonly index: number
  readonly done: boolean
}

export function createIntroSequenceState(): IntroSequenceState {
  return { index: 0, done: false }
}

/**
 * Called when the current video finishes playing (`ended`) or fails to load (`error`) —
 * both cases move forward one step so a missing/broken render never blocks the live experience.
 */
export function advanceIntroSequence(state: IntroSequenceState, videoCount: number): IntroSequenceState {
  if (state.done) {
    return state
  }
  const nextIndex = state.index + 1
  if (nextIndex >= videoCount) {
    return { index: state.index, done: true }
  }
  return { index: nextIndex, done: false }
}

/**
 * "Skip" always jumps straight past the entire remaining sequence into the live experience,
 * regardless of which video is currently playing.
 */
export function skipIntroSequence(state: IntroSequenceState): IntroSequenceState {
  return { index: state.index, done: true }
}

export function activeOverlayText(
  overlays: readonly IntroOverlayTextCue[] | undefined,
  currentTime: number,
): string | undefined {
  if (!overlays) {
    return undefined
  }
  return overlays.find(cue => currentTime >= cue.start && currentTime < cue.end)?.text
}

/**
 * The intro video played before the live playlist experience begins. The live experience's
 * own hero moment is the YouTube-hosted Track 0 playback that `startSoundtrack()` already
 * starts once this sequence completes — there is no separate local hero video file to chain
 * here, so this sequence contains only the new, self-produced intro video.
 *
 * Paths are resolved against BASE_URL so fork previews and production both work
 * (see AGENTS.md "Public asset fetches" convention).
 */
export function buildIntroVideoSequence(baseUrl: string): readonly IntroVideoSpec[] {
  return [
    {
      id: 'wolves-intro',
      src: `${baseUrl}videos/wolves-intro-1440p.mp4`,
      overlays: [
        { text: 'In this world ... our contributors are not just stewards, they are Guardians!', start: 0, end: 6 },
        { text: 'Who would _dare_ to Fight for the User', start: 6, end: 12 },
      ],
    },
  ] as const
}
