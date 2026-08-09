import type { BackCatalogueSlide, BackCatalogueSlideKind } from '@/data/back-catalogue-order'
import { describe, expect, it } from 'vitest'
import {
  classifyCuratedSlide,
  isCncfSlide,
  mergeAtRandomPositions,
  orderBackCatalogueSlides,
  spaceOutCuratedSlides,
} from '@/data/back-catalogue-order'

/**
 * Deterministic PRNG. These are distribution assertions, so seeding them is the
 * difference between a regression guard and an intermittently red CI run.
 */
function seededRandom(seed = 1) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function slide(kind: BackCatalogueSlideKind, index: number, event = 'KC+CNC_EU_240319'): BackCatalogueSlide {
  return {
    id: `${kind}-${index}`,
    title: kind === 'cncf' ? `${event}_Breakouts_MN_${index}` : `Curated slide ${index}`,
    kind,
  }
}

function buildPool() {
  const cncf = Array.from({ length: 120 }, (_, index) =>
    slide('cncf', index, `KC+CNC_EU_24031${index % 5}`))
  const curated = [
    ...Array.from({ length: 30 }, (_, index) => slide('curated', index)),
    ...Array.from({ length: 8 }, (_, index) => slide('showcase', index)),
    ...Array.from({ length: 4 }, (_, index) => slide('mascot', index)),
    ...Array.from({ length: 6 }, (_, index) => slide('hero', index)),
  ]
  return { cncf, curated }
}

describe('classifyCuratedSlide', () => {
  it('credits locally mirrored CNCF exports to the CNCF stream', () => {
    expect(classifyCuratedSlide('wolves/people/flickr-53608872377.webp', 'KC+CNC_EU_240319_KCS_Breakouts_MN_024'))
      .toBe('cncf')
  })

  it('credits an authored portrait to the curated catalogue', () => {
    expect(classifyCuratedSlide('wolves/people/Bluefin Advisor Chris Aniszczyk.webp', 'Bluefin Advisor Chris Aniszczyk'))
      .toBe('curated')
  })

  it('separates product showcase from commissioned mascot art', () => {
    expect(classifyCuratedSlide('wolves/showcase/desktop.webp', 'Desktop')).toBe('showcase')
    expect(classifyCuratedSlide('wolves/wolves/bluefin-eyes.webp', 'Eyes')).toBe('mascot')
  })

  it('classifies a day/night mascot pair by its synthetic name', () => {
    expect(classifyCuratedSlide('bluefin-duality', 'Duality (Day & Night)')).toBe('mascot')
  })
})

describe('mergeAtRandomPositions', () => {
  it('preserves the internal order of both inputs', () => {
    const merged = mergeAtRandomPositions(['a', 'b', 'c'], ['x', 'y'], () => 0.5)

    expect(merged.filter(item => 'abc'.includes(item))).toEqual(['a', 'b', 'c'])
    expect(merged.filter(item => 'xy'.includes(item))).toEqual(['x', 'y'])
    expect(merged).toHaveLength(5)
  })

  it('keeps every item when one side is empty', () => {
    expect(mergeAtRandomPositions(['a', 'b'], [], () => 0.5)).toEqual(['a', 'b'])
    expect(mergeAtRandomPositions([], ['x'], () => 0.5)).toEqual(['x'])
  })
})

describe('spaceOutCuratedSlides', () => {
  it('separates curated slides that land back-to-back', () => {
    const spaced = spaceOutCuratedSlides([
      slide('curated', 0),
      slide('hero', 0),
      slide('cncf', 0),
      slide('cncf', 1),
      slide('cncf', 2),
    ])

    for (let index = 1; index < spaced.length; index++) {
      expect(isCncfSlide(spaced[index]) || isCncfSlide(spaced[index - 1])).toBe(true)
    }
  })

  it('leaves the sequence intact when there are too few CNCF slides to separate', () => {
    const input = [slide('curated', 0), slide('showcase', 0), slide('hero', 0)]
    expect(spaceOutCuratedSlides(input).map(item => item.id)).toEqual(input.map(item => item.id))
  })
})

describe('orderBackCatalogueSlides', () => {
  it('never places two non-CNCF slides back-to-back', () => {
    const { cncf, curated } = buildPool()

    const random = seededRandom(5)
    for (let run = 0; run < 50; run++) {
      const ordered = orderBackCatalogueSlides(cncf, curated, random)
      for (let index = 1; index < ordered.length; index++) {
        expect(isCncfSlide(ordered[index]) || isCncfSlide(ordered[index - 1])).toBe(true)
      }
    }
  })

  it('carries every slide through exactly once', () => {
    const { cncf, curated } = buildPool()
    const ordered = orderBackCatalogueSlides(cncf, curated, seededRandom(19))

    expect(ordered).toHaveLength(cncf.length + curated.length)
    expect(new Set(ordered.map(item => item.id)).size).toBe(cncf.length + curated.length)
  })

  it('includes every provenance kind', () => {
    const { cncf, curated } = buildPool()
    const kinds = new Set(orderBackCatalogueSlides(cncf, curated, seededRandom(23)).map(item => item.kind))

    expect(kinds).toEqual(new Set(['cncf', 'curated', 'showcase', 'mascot', 'hero']))
  })

  // The owner's instruction was "do not give a preference" — CNCF should lead
  // because it outnumbers the curated set, not because the ordering favours it.
  // A pinned opener (the old behaviour reserved three showcase slides for the
  // front) would drive the curated share of first slides to 1.0.
  it('does not reserve the opening slide for any category', () => {
    const { cncf, curated } = buildPool()
    const runs = 200
    const random = seededRandom(11)
    let cncfFirst = 0

    for (let run = 0; run < runs; run++) {
      if (isCncfSlide(orderBackCatalogueSlides(cncf, curated, random)[0])) {
        cncfFirst++
      }
    }

    const expectedShare = cncf.length / (cncf.length + curated.length)
    expect(cncfFirst / runs).toBeGreaterThan(expectedShare - 0.2)
    expect(cncfFirst / runs).toBeLessThan(expectedShare + 0.2)
  })

  it('keeps consecutive CNCF slides on different events', () => {
    const { cncf, curated } = buildPool()
    const ordered = orderBackCatalogueSlides(cncf, curated, seededRandom(13))
    const cncfOnly = ordered.filter(isCncfSlide)

    const adjacentSameEvent = cncfOnly.filter((item, index) =>
      index > 0 && item.title.split('_')[2] === cncfOnly[index - 1].title.split('_')[2]).length

    expect(adjacentSameEvent).toBeLessThan(cncfOnly.length * 0.1)
  })

  it('preserves the authored hero rotation order', () => {
    const cncf = Array.from({ length: 40 }, (_, index) => slide('cncf', index, `KC+CNC_EU_24031${index % 4}`))
    const heroes = Array.from({ length: 6 }, (_, index) => slide('hero', index))

    const ordered = orderBackCatalogueSlides(cncf, heroes, seededRandom(17))
    const heroIds = ordered.filter(item => item.kind === 'hero').map(item => item.id)

    expect(heroIds).toEqual(heroes.map(item => item.id))
  })
})
