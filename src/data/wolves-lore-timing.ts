export interface LoreTimingInput {
  kind: 'quote' | 'chatlog'
  body: string
  attribution?: string
}

export interface LoreTimingSlot {
  id: string
  startTime: number
  endTime: number
  duration: number
  minimumDuration: number
}

const CHARACTERS_PER_SECOND = 15
const BASE_SECONDS = 3

export function estimateLoreReadDuration(input: LoreTimingInput): number {
  const characters = input.body.trim().length + (input.attribution?.trim().length ?? 0)
  return Math.max(BASE_SECONDS, characters / CHARACTERS_PER_SECOND)
}

export function allocateLoreSlots(
  entries: readonly (LoreTimingInput & { id: string })[],
  startTime: number,
  endTime: number,
  _lockedAnchors: ReadonlyMap<string, number> = new Map(),
): LoreTimingSlot[] {
  const minimumDurations = entries.map(entry => estimateLoreReadDuration(entry))
  const available = Math.max(0, endTime - startTime)
  const chatMinimumTotal = entries.reduce(
    (sum, entry, index) => sum + (entry.kind === 'chatlog' ? minimumDurations[index]! : 0),
    0,
  )
  const chatScale = chatMinimumTotal > available && chatMinimumTotal > 0
    ? available / chatMinimumTotal
    : 1
  const chatAllocated = chatMinimumTotal * chatScale
  const staticMinimumTotal = entries.reduce(
    (sum, entry, index) => sum + (entry.kind === 'chatlog' ? 0 : minimumDurations[index]!),
    0,
  )
  const staticScale = staticMinimumTotal > 0
    ? Math.max(0, available - chatAllocated) / staticMinimumTotal
    : 0
  let cursor = startTime
  return entries.map((entry, index) => {
    const minimumDuration = minimumDurations[index]
    const duration = minimumDuration * (entry.kind === 'chatlog' ? chatScale : staticScale)
    const slot = { id: entry.id, startTime: cursor, endTime: cursor + duration, duration, minimumDuration }
    cursor += duration
    return slot
  }).map((slot, index, slots) => index === slots.length - 1 ? { ...slot, endTime } : slot)
}
