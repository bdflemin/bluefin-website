import { describe, expect, it } from 'vitest'
import { shuffleWolvesGalleryPhotos } from '@/data/wolves-gallery-shuffle'

const photos = [
  { id: 'na-1', title: 'KC+CNC_NA_251109_A' },
  { id: 'na-2', title: 'KC+CNC_NA_251109_B' },
  { id: 'eu-1', title: 'KC+CNC_EU_260322_A' },
  { id: 'detroit-1', title: 'KC+CNC_NA_Detroit_221027_A' },
]

describe('wolvesGalleryShuffle', () => {
  it('shuffles every Flickr photo once without preserving source event order', () => {
    const shuffled = shuffleWolvesGalleryPhotos(photos, () => 0)

    expect(shuffled.map(photo => photo.id)).toEqual([
      'na-2',
      'eu-1',
      'detroit-1',
      'na-1',
    ])
    expect(new Set(shuffled.map(photo => photo.id))).toHaveLength(photos.length)
  })
})
