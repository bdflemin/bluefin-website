import { describe, expect, it } from 'vitest'
import {
  getWolvesOrgAdBlend,
  WOLVES_AD_FADE_SECONDS,
  WOLVES_AD_ROTATION_SECONDS,
  WOLVES_ORG_AD_PAIRS,
} from '@/data/wolves-org-ads'

describe('wolves organization ad pairs', () => {
  it('starts a synchronized four-second crossfade every 30 seconds', () => {
    expect(WOLVES_AD_ROTATION_SECONDS).toBe(30)
    expect(WOLVES_AD_FADE_SECONDS).toBe(4)
    expect(getWolvesOrgAdBlend(0).opacities).toEqual([1, 0])
    expect(getWolvesOrgAdBlend(29.999).opacities).toEqual([1, 0])
    expect(getWolvesOrgAdBlend(30).opacities).toEqual([1, 0])
    expect(getWolvesOrgAdBlend(32).opacities).toEqual([0.5, 0.5])
    expect(getWolvesOrgAdBlend(34).opacities).toEqual([0, 1])
    expect(getWolvesOrgAdBlend(62).opacities).toEqual([0.5, 0.5])
    expect(getWolvesOrgAdBlend(64).opacities).toEqual([1, 0])
  })

  it('pairs GNOME with KubeCon and Flathub with KDE', () => {
    expect(WOLVES_ORG_AD_PAIRS.map(pair => pair.map(ad => ad.id))).toEqual([
      ['gnome', 'kubecon'],
      ['flathub', 'kde'],
    ])
  })
})
