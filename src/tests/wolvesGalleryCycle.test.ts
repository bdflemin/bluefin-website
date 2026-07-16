import { describe, expect, it } from 'vitest'
import { buildWolvesGalleryCycle, getWolvesGalleryEventKey } from '@/data/wolves-gallery-cycle'

const photos = [
  { id: 'na-1', title: 'KC+CNC_NA_251109_A' },
  { id: 'na-2', title: 'KC+CNC_NA_251109_B' },
  { id: 'eu-1', title: 'KC+CNC_EU_260322_A' },
  { id: 'detroit-1', title: 'KC+CNC_NA_Detroit_221027_A' },
]

describe('wolvesGalleryCycle', () => {
  it('derives a stable event key from a Flickr title', () => {
    expect(getWolvesGalleryEventKey(photos[0])).toBe('KC+CNC_NA_251109')
    expect(getWolvesGalleryEventKey(photos[3])).toBe('KC+CNC_NA_Detroit')
  })

  it('uses each photo once and does not repeat an event within a round', () => {
    const cycle = buildWolvesGalleryCycle(photos, () => 0)

    expect(cycle.map(photo => photo.id)).toHaveLength(photos.length)
    expect(new Set(cycle.map(photo => photo.id))).toHaveLength(photos.length)
    expect(cycle.slice(0, 3).map(getWolvesGalleryEventKey)).toEqual([
      'KC+CNC_NA_251109',
      'KC+CNC_EU_260322',
      'KC+CNC_NA_Detroit',
    ])
  })
})
