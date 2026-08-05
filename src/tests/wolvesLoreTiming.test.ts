import { describe, expect, it } from 'vitest'
import { allocateLoreSlots, estimateLoreReadDuration } from '../data/wolves-lore-timing'

describe('wolves lore timing', () => {
  it('gives longer conversations more time than short quotes', () => {
    const short = estimateLoreReadDuration({ kind: 'quote', body: 'A short quote.', attribution: 'Author' })
    const long = estimateLoreReadDuration({ kind: 'chatlog', body: 'A'.repeat(500), attribution: 'ARCHIVE' })

    expect(short).toBeGreaterThanOrEqual(3)
    expect(long).toBeGreaterThan(short)
  })

  it('reserves a slower reading pace for quotes', () => {
    const quote = estimateLoreReadDuration({ kind: 'quote', body: 'A'.repeat(100) })
    const chat = estimateLoreReadDuration({ kind: 'chatlog', body: 'A'.repeat(100) })

    expect(quote).toBeGreaterThan(chat)
    expect(estimateLoreReadDuration({ kind: 'quote', body: '' })).toBe(15)
  })

  it('allocates every slot enough time without moving locked anchors', () => {
    const slots = allocateLoreSlots(
      [
        { id: 'short', kind: 'quote', body: 'Short.', attribution: 'A' },
        { id: 'long', kind: 'chatlog', body: 'B'.repeat(600), attribution: 'B' },
      ],
      220,
      398,
      new Map([['locked', 100]]),
    )

    expect(slots[0].startTime).toBe(220)
    expect(slots[slots.length - 1]?.endTime).toBe(398)
    for (const slot of slots) {
      expect(slot.duration).toBeGreaterThanOrEqual(slot.minimumDuration)
    }
  })

  it('keeps both quotes and chats visible when a range is constrained', () => {
    const slots = allocateLoreSlots(
      [
        { id: 'quote', kind: 'quote', body: 'A'.repeat(300), attribution: 'ARCHIVE' },
        { id: 'chat', kind: 'chatlog', body: 'B'.repeat(300), attribution: 'ARCHIVE' },
      ],
      0,
      20,
    )

    expect(slots[0]?.duration).toBeGreaterThan(0)
    expect(slots[1]?.duration).toBeGreaterThanOrEqual(3)
  })

  it('reflows remaining chats contiguously after a record is removed', () => {
    const records = [
      { id: 'first', kind: 'chatlog' as const, body: 'A'.repeat(90) },
      { id: 'third', kind: 'chatlog' as const, body: 'B'.repeat(90) },
    ]
    const slots = allocateLoreSlots(records, 0, 40)

    expect(slots[0]?.startTime).toBe(0)
    expect(slots[1]?.startTime).toBeCloseTo(slots[0]!.endTime, 8)
    expect(slots[1]?.endTime).toBe(40)
    expect(slots.every(slot => slot.endTime > slot.startTime)).toBe(true)
  })
})
