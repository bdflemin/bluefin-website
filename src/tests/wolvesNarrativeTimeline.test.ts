import { describe, expect, it } from 'vitest'
import { estimatePageSeconds } from '../components/wolves/lore/lore-pages'
import { loadAllLoreRecords } from '../data/wolves-lore-records'
import { CHAT_COMPLETION_PAUSE_SECONDS, loreRecordPages } from '../data/wolves-lore-timing'
import {
  getNarrativeSlotForTime,
  lockedNarrativeSlots,
  wolvesNarrativeTimeline,
} from '../data/wolves-narrative-timeline'
import { TRACK_ZERO_SECTIONS } from '../data/wolves-track-zero-beats'

describe('wolves narrative timeline', () => {
  it('contains every visible release artifact exactly once', () => {
    const ids = wolvesNarrativeTimeline.map(slot => slot.artifactId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('lorem-pursuit-1')
    expect(ids).toContain('blue-universal-acquires-wayland-yutani')
    expect(ids).not.toContain('lorem-prologue-2')
    expect(ids).not.toContain('lorem-prologue-1')
    expect(ids).not.toContain('john-seager')
    expect(ids).not.toContain('do-not-reply')
  })

  it('keeps The Artifact source record available while hiding it from the video', () => {
    const artifact = loadAllLoreRecords().find(record => record.id === 'lorem-prologue-1')

    expect(artifact).toMatchObject({
      id: 'lorem-prologue-1',
      metadata: { title: 'The Artifact' },
    })
    expect(wolvesNarrativeTimeline.map(slot => slot.artifactId)).not.toContain(artifact?.id)
  })

  it('keeps unlocked lore in authored timeline order', () => {
    const ids = wolvesNarrativeTimeline.map(slot => slot.artifactId)
    expect(ids.indexOf('lorem-pursuit-1')).toBeGreaterThan(ids.indexOf('arthur-c-clarke-1'))
    expect(ids).not.toContain('john-seager')
    expect(ids[ids.length - 1]).toBe('blue-universal-acquires-wayland-yutani')
  })

  it('preserves the approved first, middle, and final anchors', () => {
    expect(getNarrativeSlotForTime(0)).toMatchObject({
      artifactId: 'arthur-c-clarke-1',
      startTime: 0,
    })
    expect(getNarrativeSlotForTime(180)).toMatchObject({
      artifactId: 'lorem-pursuit-1',
      startTime: 150,
      endTime: 220,
    })
    // The closing bulletin is anchored to the finale beat rather than a round
    // number: it starts early enough that its death-reveal page lands exactly
    // on TRACK_ZERO_SECTIONS.finaleStart. See wolvesFinaleReveal.test.ts.
    expect(getNarrativeSlotForTime(TRACK_ZERO_SECTIONS.finaleStart)).toMatchObject({
      artifactId: 'blue-universal-acquires-wayland-yutani',
      endTime: 425,
    })
    expect(getNarrativeSlotForTime(TRACK_ZERO_SECTIONS.finaleStart).startTime)
      .toBeLessThan(TRACK_ZERO_SECTIONS.finaleStart)
  })

  it('keeps every registered narrative lock at its declared time', () => {
    for (const lock of lockedNarrativeSlots) {
      const slot = wolvesNarrativeTimeline.find(slot => slot.artifactId === lock.artifactId)

      expect(slot?.startTime).toBe(lock.startTime)
      if (lock.endTime !== undefined) {
        expect(slot?.endTime).toBe(lock.endTime)
      }
    }
  })

  it('reserves a five-second completion pause for every unlocked conversation', () => {
    const records = new Map(loadAllLoreRecords().map(record => [record.id, record] as const))
    const lockedIds = new Set(lockedNarrativeSlots.map(slot => slot.artifactId))

    for (const slot of wolvesNarrativeTimeline) {
      const record = records.get(slot.artifactId)
      if (!record || record.kind !== 'chatlog' || lockedIds.has(record.id)) {
        continue
      }

      expect(slot.endTime - slot.startTime).toBeGreaterThanOrEqual(CHAT_COMPLETION_PAUSE_SECONDS - 1e-8)
    }
  })

  it('allocates unlocked lore between the locked anchors', () => {
    const finalStart = wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1].startTime
    const middle = wolvesNarrativeTimeline.filter(slot => slot.startTime >= 220 && slot.endTime <= finalStart)
    expect(middle.length).toBeGreaterThan(0)
    expect(middle.every(slot => slot.endTime > slot.startTime)).toBe(true)
  })

  it('keeps the recomputed middle contiguous', () => {
    const finalStart = wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1].startTime
    const middle = wolvesNarrativeTimeline.filter(slot => slot.startTime >= 220 && slot.endTime <= finalStart)
    for (let index = 1; index < middle.length; index++) {
      expect(middle[index].startTime).toBeCloseTo(middle[index - 1].endTime, 8)
    }
  })

  it('uses the available unlocked range for readable post-Golden-Era lore', () => {
    const retimedSlots = wolvesNarrativeTimeline.filter(slot => slot.startTime >= 220 && slot.endTime <= 398)

    for (const slot of retimedSlots) {
      expect(slot.endTime - slot.startTime).toBeGreaterThan(0)
    }
  })

  it('gives every Arthur C. Clarke quote its full readable page', () => {
    const records = new Map(loadAllLoreRecords().map(record => [record.id, record] as const))

    for (const artifactId of ['arthur-c-clarke-1', 'arthur-c-clarke-2', 'arthur-c-clarke-3']) {
      const slot = wolvesNarrativeTimeline.find(slot => slot.artifactId === artifactId)
      const pages = loreRecordPages({ kind: 'quote', body: records.get(artifactId)?.body ?? '' })

      expect(slot).toBeDefined()
      // A quote holds one complete page for its own reading cost; the old
      // fifteen-second constant is replaced by the shared page model.
      expect(slot!.endTime - slot!.startTime).toBeGreaterThanOrEqual(estimatePageSeconds(pages[0]!) - 1e-8)
    }
  })

  it('keeps the recomputed unlocked pool contiguous and authored', () => {
    const finalStart = wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1].startTime
    const middle = wolvesNarrativeTimeline.filter(slot => slot.startTime >= 220 && slot.endTime <= finalStart)
    for (let index = 1; index < middle.length; index++) {
      expect(middle[index].startTime).toBeCloseTo(middle[index - 1].endTime, 8)
    }
    expect(new Set(middle.map(slot => slot.artifactId)).size).toBe(middle.length)
  })

  it('uses the next slot at exact boundaries and holds the final entry afterward', () => {
    expect(getNarrativeSlotForTime(150)?.artifactId).toBe('lorem-pursuit-1')
    expect(getNarrativeSlotForTime(220)?.artifactId)
      .toBe(wolvesNarrativeTimeline.find(slot => slot.startTime === 220)?.artifactId)
    expect(getNarrativeSlotForTime(425)?.artifactId).toBe('blue-universal-acquires-wayland-yutani')
    expect(getNarrativeSlotForTime(1_000)?.artifactId).toBe('blue-universal-acquires-wayland-yutani')
  })

  it('keeps every visible non-anchor entry on screen for a positive duration', () => {
    for (const slot of wolvesNarrativeTimeline.filter(slot => slot.startTime > 0 && slot.endTime < 398)) {
      expect(slot.endTime - slot.startTime).toBeGreaterThan(0)
    }
  })
})
