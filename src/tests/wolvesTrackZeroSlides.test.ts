import { describe, expect, it } from 'vitest'
import {
  pinJonoBaconAtTrackZeroWindow,
  pinTrackZeroHeroSlides,
  splitTrackZeroFastFinaleSlides,
  trackZeroFastFinalePhotoIds,
} from '../data/wolves-track-zero-slides'

describe('wolves Track 0 slide locks', () => {
  it('moves Jono Bacon to the first People slot without reordering the other slides', () => {
    const jono = { id: 'wolves/people/interview-jono-bacon-cult-psychology-kubernetes.webp' }
    const before = [{ id: 'people-a' }, { id: 'people-b' }, jono, { id: 'people-c' }]

    expect(pinJonoBaconAtTrackZeroWindow(before)).toEqual([
      jono,
      { id: 'people-a' },
      { id: 'people-b' },
      { id: 'people-c' },
    ])
  })

  it('pins Marina Moore immediately after Jono Bacon without reordering other slides', () => {
    const jono = { id: 'wolves/people/interview-jono-bacon-cult-psychology-kubernetes.webp' }
    const marina = { id: 'wolves/people/kubecon-55168684055.webp' }
    const before = [{ id: 'people-a' }, marina, { id: 'people-b' }, jono, { id: 'people-c' }]

    expect(pinTrackZeroHeroSlides(before)).toEqual([
      jono,
      marina,
      { id: 'people-a' },
      { id: 'people-b' },
      { id: 'people-c' },
    ])
  })

  it('keeps an already pinned pair stable and tolerates a missing hero slide', () => {
    const jono = { id: 'wolves/people/interview-jono-bacon-cult-psychology-kubernetes.webp' }
    const marina = { id: 'wolves/people/kubecon-55168684055.webp' }
    const regular = { id: 'people-a' }

    expect(pinTrackZeroHeroSlides([jono, marina, regular])).toEqual([jono, marina, regular])
    expect(pinTrackZeroHeroSlides([marina, regular])).toEqual([marina, regular])
  })

  it('reserves the new people photos for the fast finale without reordering regular slides', () => {
    const newPhoto = { id: 'wolves/people/liz.webp' }
    const regular = [{ id: 'people-a' }, { id: 'people-b' }]
    const { regularSlides, finaleSlides } = splitTrackZeroFastFinaleSlides([
      regular[0],
      newPhoto,
      regular[1],
    ])

    expect(trackZeroFastFinalePhotoIds).toContain(newPhoto.id)
    expect(regularSlides).toEqual(regular)
    expect(finaleSlides).toEqual([newPhoto])
  })
})
