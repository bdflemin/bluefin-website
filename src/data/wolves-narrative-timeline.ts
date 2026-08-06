import { loadAllLoreRecords } from './wolves-lore-records'
import { allocateLoreSlots } from './wolves-lore-timing'
import { wolvesRelease } from './wolves-story'

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

export const lockedNarrativeSlots: readonly WolvesNarrativeLock[] = [
  { artifactId: 'lorem-pursuit-1', startTime: 150, endTime: 220 },
  { artifactId: 'blue-universal-acquires-wayland-yutani', startTime: 398, endTime: 425 },
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
const finalIndex = authoredArtifactIds.indexOf('blue-universal-acquires-wayland-yutani')
const opening = authoredArtifactIds.slice(0, pursuitIndex)
const middle = authoredArtifactIds.slice(pursuitIndex + 1, finalIndex)
export const wolvesNarrativeTimeline: readonly WolvesNarrativeSlot[] = [
  ...allocateRange(opening, 0, 150),
  { artifactId: 'lorem-pursuit-1', startTime: 150, endTime: 220 },
  ...allocateRange(middle, 220, 398),
  { artifactId: 'blue-universal-acquires-wayland-yutani', startTime: 398, endTime: 425 },
]

export function getNarrativeSlotForTime(time: number): WolvesNarrativeSlot {
  const normalizedTime = Math.max(0, time)
  return wolvesNarrativeTimeline.find(slot => normalizedTime < slot.endTime)
    ?? wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1]
}
