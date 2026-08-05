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
const QUOTE_CHARACTERS_PER_SECOND = 10
const BASE_SECONDS = 3
const QUOTE_BASE_SECONDS = 15
export const CHAT_COMPLETION_PAUSE_SECONDS = 5

export function estimateLoreReadDuration(input: LoreTimingInput): number {
  const characters = input.body.trim().length + (input.attribution?.trim().length ?? 0)
  const charactersPerSecond = input.kind === 'quote' ? QUOTE_CHARACTERS_PER_SECOND : CHARACTERS_PER_SECOND
  const baseSeconds = input.kind === 'quote' ? QUOTE_BASE_SECONDS : BASE_SECONDS
  return Math.max(baseSeconds, characters / charactersPerSecond)
}

export function allocateLoreSlots(
  entries: readonly (LoreTimingInput & { id: string })[],
  startTime: number,
  endTime: number,
  _lockedAnchors: ReadonlyMap<string, number> = new Map(),
): LoreTimingSlot[] {
  const minimumDurations = entries.map(entry => estimateLoreReadDuration(entry))
  const available = Math.max(0, endTime - startTime)
  const quoteMinimumTotal = entries.reduce(
    (sum, entry, index) => sum + (entry.kind === 'quote' ? minimumDurations[index]! : 0),
    0,
  )
  const chatCount = entries.filter(entry => entry.kind === 'chatlog').length
  const chatFloorTotal = chatCount * CHAT_COMPLETION_PAUSE_SECONDS
  const quoteAvailable = Math.max(0, available - chatFloorTotal)
  const quoteScale = quoteMinimumTotal > quoteAvailable && quoteMinimumTotal > 0
    ? quoteAvailable / quoteMinimumTotal
    : 1
  const quoteAllocated = quoteMinimumTotal * quoteScale
  const chatExtraTotal = entries.reduce(
    (sum, entry, index) => sum + (entry.kind === 'chatlog'
      ? Math.max(0, minimumDurations[index]! - CHAT_COMPLETION_PAUSE_SECONDS)
      : 0),
    0,
  )
  const chatExtraAvailable = Math.max(0, available - quoteAllocated - chatFloorTotal)
  const chatExtraScale = chatExtraTotal > 0
    ? chatExtraAvailable / chatExtraTotal
    : 0
  const durations = entries.map((entry, index) => {
    if (entry.kind === 'quote') {
      return minimumDurations[index]! * quoteScale
    }
    return CHAT_COMPLETION_PAUSE_SECONDS
      + Math.max(0, minimumDurations[index]! - CHAT_COMPLETION_PAUSE_SECONDS) * chatExtraScale
  })

  let cursor = startTime
  return entries.map((entry, index) => {
    const minimumDuration = minimumDurations[index]
    const duration = durations[index]!
    const slot = { id: entry.id, startTime: cursor, endTime: cursor + duration, duration, minimumDuration }
    cursor += duration
    return slot
  }).map((slot, index, slots) => index === slots.length - 1 ? { ...slot, endTime } : slot)
}
