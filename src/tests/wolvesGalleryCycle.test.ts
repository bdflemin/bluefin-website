import { describe, expect, it } from 'vitest'
import { buildWolvesGalleryCycle, getWolvesGalleryEventKey, separateAdjacentEvents } from '@/data/wolves-gallery-cycle'

/** Deterministic PRNG: the spread relies on jitter, so a constant breaks it. */
function seededRandom(seed = 1) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function cncfPhoto(event: string, index: number) {
  return { id: `${event}-${index}`, title: `${event}_Breakouts_MN_${String(index).padStart(3, '0')}` }
}

describe('getWolvesGalleryEventKey', () => {
  it('identifies a shoot from the first three filename segments', () => {
    expect(getWolvesGalleryEventKey({
      id: '1',
      title: 'KC+CNC_EU_240319_KCS_GroupPhoto_MN_001',
    })).toBe('KC+CNC_EU_240319')
  })

  it('groups frames from the same shoot together despite differing counters', () => {
    const first = getWolvesGalleryEventKey({ id: '1', title: 'KC+CNC_NA_251109_MaintainerSummit_ML-MN_029' })
    const second = getWolvesGalleryEventKey({ id: '2', title: 'KC+CNC_NA_251109_MaintainerSummit_ML-MN_036' })
    expect(first).toBe(second)
  })

  // Authored titles carry no underscore structure, so they group by the whole
  // title. Distinct portraits each form their own single-item group, while
  // several pieces sharing one credit line ("Bluefin created by ...") group
  // together and get spread apart — which is the desired behaviour.
  it('groups authored prose titles by the title itself', () => {
    expect(getWolvesGalleryEventKey({
      id: 'wolves/people/advisor.webp',
      title: 'Bluefin Advisor Chris Aniszczyk',
    })).toBe('Bluefin Advisor Chris Aniszczyk')
  })

  it('falls back to the photo id when a title is empty', () => {
    expect(getWolvesGalleryEventKey({ id: 'wolves/people/untitled.webp', title: '' }))
      .toBe('wolves/people/untitled.webp')
  })
})

describe('buildWolvesGalleryCycle', () => {
  it('never repeats an event back-to-back while other events remain', () => {
    const photos = [
      ...Array.from({ length: 8 }, (_, index) => cncfPhoto('KC+CNC_EU_240319', index)),
      ...Array.from({ length: 8 }, (_, index) => cncfPhoto('KC+CNC_NA_251109', index)),
      ...Array.from({ length: 8 }, (_, index) => cncfPhoto('KC+CNC_EU_260322', index)),
    ]

    const cycle = buildWolvesGalleryCycle(photos, seededRandom())

    for (let index = 1; index < cycle.length; index++) {
      expect(getWolvesGalleryEventKey(cycle[index])).not.toBe(getWolvesGalleryEventKey(cycle[index - 1]))
    }
  })

  // Round-robin dealt every event once per round, so the hundreds of
  // single-photo events in the live feed all landed in round one and filled the
  // opening stretch. Stratified placement spreads them across the whole run.
  it('does not front-load single-photo events', () => {
    const photos = [
      ...Array.from({ length: 40 }, (_, index) => cncfPhoto('KC+CNC_EU_240319', index)),
      ...Array.from({ length: 40 }, (_, index) => ({ id: `solo-${index}`, title: `Untitled ${index}` })),
    ]

    const cycle = buildWolvesGalleryCycle(photos, seededRandom())
    const soloInFirstQuarter = cycle.slice(0, 20).filter(photo => photo.id.startsWith('solo-')).length

    expect(soloInFirstQuarter).toBeLessThan(18)
  })

  // Regression guard for 255f61fb, which replaced this module with a plain
  // Fisher-Yates and silently dropped event diversity. A bare shuffle deals
  // long same-event runs; this asserts the pool is genuinely interleaved.
  it('beats a plain shuffle on same-event adjacency', () => {
    const photos = Array.from({ length: 60 }, (_, index) =>
      cncfPhoto(`KC+CNC_EU_2403${index % 3}0`, index))

    const cycle = buildWolvesGalleryCycle(photos, seededRandom(7))
    const adjacentSameEvent = cycle.filter((photo, index) =>
      index > 0 && getWolvesGalleryEventKey(photo) === getWolvesGalleryEventKey(cycle[index - 1])).length

    // A plain shuffle over three events averages ~⅓ of pairs on the same event.
    expect(adjacentSameEvent).toBe(0)
  })

  it('preserves every photo exactly once', () => {
    const photos = Array.from({ length: 25 }, (_, index) => cncfPhoto(`event-${index % 4}`, index))
    const cycle = buildWolvesGalleryCycle(photos, seededRandom(3))

    expect(cycle).toHaveLength(photos.length)
    expect(new Set(cycle.map(photo => photo.id)).size).toBe(photos.length)
  })

  it('returns an empty cycle for an empty pool', () => {
    expect(buildWolvesGalleryCycle([])).toEqual([])
  })
})

describe('separateAdjacentEvents', () => {
  it('breaks up a same-event run', () => {
    const photos = [
      { id: '1', title: 'KC+CNC_EU_240319_A_MN_1' },
      { id: '2', title: 'KC+CNC_EU_240319_A_MN_2' },
      { id: '3', title: 'KC+CNC_NA_251109_A_MN_1' },
      { id: '4', title: 'KC+CNC_EU_260322_A_MN_1' },
    ]

    const separated = separateAdjacentEvents(photos)

    for (let index = 1; index < separated.length; index++) {
      expect(getWolvesGalleryEventKey(separated[index]))
        .not
        .toBe(getWolvesGalleryEventKey(separated[index - 1]))
    }
  })

  it('leaves a single-event pool untouched rather than looping', () => {
    const photos = [
      { id: '1', title: 'KC+CNC_EU_240319_A_MN_1' },
      { id: '2', title: 'KC+CNC_EU_240319_A_MN_2' },
    ]

    expect(separateAdjacentEvents(photos).map(photo => photo.id)).toEqual(['1', '2'])
  })
})
