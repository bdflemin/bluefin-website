import { estimatePageSeconds } from '../components/wolves/lore/lore-pages'
import { loadAllLoreRecords } from './wolves-lore-records'
import { allocateLoreSlots, loreRecordPages } from './wolves-lore-timing'
import { wolvesRelease } from './wolves-story'
import { TRACK_ZERO_SECTIONS } from './wolves-track-zero-beats'

export interface WolvesNarrativeSlot {
  artifactId: string
  startTime: number
  endTime: number
}

interface WolvesNarrativeLock {
  artifactId: string
  startTime: number
  endTime?: number
}

const FINAL_ARTIFACT_ID = 'blue-universal-acquires-wayland-yutani'

/** The closing bulletin holds until the track hands off to silence. */
const FINAL_ARTIFACT_END = 425

/** The page that names the dead doctor; the show's dramatic reveal. */
const DEATH_REVEAL_MARKER = 'Andy Anderson'

const finalRecordPages = loreRecordPages({
  kind: 'prose',
  body: loadAllLoreRecords().find(record => record.id === FINAL_ARTIFACT_ID)?.body ?? '',
})

/**
 * Start the closing bulletin so its death-reveal page turns up exactly on
 * `finaleStart`, the measured beat the "Become Legend" cue fires on. The reveal
 * and the finale must land together: the audience reads that the doctor is dead
 * on the same beat the music says Become Legend.
 *
 * Derived rather than written down, because the answer depends on what the
 * pages before the reveal cost to read. A hard-coded start silently drifts off
 * the beat the moment the bulletin is re-edited or the reading pace changes.
 */
const finalRecordStartTime = TRACK_ZERO_SECTIONS.finaleStart - finalRecordPages
  .slice(0, Math.max(0, finalRecordPages.findIndex(page => page.includes(DEATH_REVEAL_MARKER))))
  .reduce((total, page) => total + estimatePageSeconds(page), 0)

export const lockedNarrativeSlots: readonly WolvesNarrativeLock[] = [
  { artifactId: 'lorem-pursuit-1', startTime: 150, endTime: 220 },
  { artifactId: FINAL_ARTIFACT_ID, startTime: finalRecordStartTime, endTime: FINAL_ARTIFACT_END },
]

const hiddenFromWolvesVideoArtifactIds = new Set([
  'do-not-reply',
  'lorem-prologue-1',
  'lorem-prologue-2',
  'john-seager',
])
const authoredArtifactIds = wolvesRelease.artifacts
  .map(artifact => artifact.id)
  .filter(id => !hiddenFromWolvesVideoArtifactIds.has(id))
const recordsById = new Map(loadAllLoreRecords().map(record => [record.id, record] as const))
function timingInput(id: string) {
  const record = recordsById.get(id)
  const kind = record?.kind === 'chatlog'
    ? 'chatlog' as const
    : record?.kind === 'quote' ? 'quote' as const : 'prose' as const
  return {
    id,
    kind,
    body: record?.body ?? id,
    attribution: record?.metadata.attribution ?? record?.metadata.sender,
  }
}
function allocateRange(ids: readonly string[], startTime: number, endTime: number): WolvesNarrativeSlot[] {
  return allocateLoreSlots(ids.map(timingInput), startTime, endTime)
    .map(slot => ({ artifactId: slot.id, startTime: slot.startTime, endTime: slot.endTime }))
}
const pursuitIndex = authoredArtifactIds.indexOf('lorem-pursuit-1')
const finalIndex = authoredArtifactIds.indexOf(FINAL_ARTIFACT_ID)
const opening = authoredArtifactIds.slice(0, pursuitIndex)
const middle = authoredArtifactIds.slice(pursuitIndex + 1, finalIndex)
export const wolvesNarrativeTimeline: readonly WolvesNarrativeSlot[] = [
  ...allocateRange(opening, 0, 150),
  { artifactId: 'lorem-pursuit-1', startTime: 150, endTime: 220 },
  ...allocateRange(middle, 220, finalRecordStartTime),
  { artifactId: FINAL_ARTIFACT_ID, startTime: finalRecordStartTime, endTime: FINAL_ARTIFACT_END },
]

export function getNarrativeSlotForTime(time: number): WolvesNarrativeSlot {
  const normalizedTime = Math.max(0, time)
  return wolvesNarrativeTimeline.find(slot => normalizedTime < slot.endTime)
    ?? wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1]
}
