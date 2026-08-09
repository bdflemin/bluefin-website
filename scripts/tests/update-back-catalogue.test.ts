import { describe, expect, it } from 'vitest'
import { auditExperience, buildExperience } from '../update-back-catalogue.js'

const album = { id: 'PLtest', title: 'Test Album', description: 'A test album' }

function entry(overrides = {}) {
  return { id: 'vid00000001', title: 'Artist - Song', duration: 200, ...overrides }
}

describe('buildExperience', () => {
  it('applies the artist override for the Voice of Baceprot channel name', () => {
    const experience = buildExperience(album, [
      entry({ id: '4aZX-C8HKJc', title: 'VoB (Voice of Baceprot) - School Revolution' }),
    ])

    expect(experience.segments[0].artist).toBe('Voice of Baceprot')
  })
})

describe('auditExperience', () => {
  it('accepts a well-formed experience', () => {
    const entries = [entry()]
    expect(() => auditExperience(album, entries, buildExperience(album, entries))).not.toThrow()
  })

  it('rejects an empty artist', () => {
    const entries = [entry()]
    const experience = buildExperience(album, entries)
    experience.segments[0].artist = '   '

    expect(() => auditExperience(album, entries, experience)).toThrow(/empty artist/)
  })

  it('rejects an empty title', () => {
    const entries = [entry()]
    const experience = buildExperience(album, entries)
    experience.segments[0].title = ''

    expect(() => auditExperience(album, entries, experience)).toThrow(/empty title/)
  })

  it('rejects an implausible duration', () => {
    const entries = [entry()]
    const experience = buildExperience(album, entries)
    experience.segments[0].durationSeconds = 60 * 60 * 5

    expect(() => auditExperience(album, entries, experience)).toThrow(/implausible duration/)
  })

  it('rejects a non-finite duration', () => {
    const entries = [entry()]
    const experience = buildExperience(album, entries)
    experience.segments[0].durationSeconds = Number.POSITIVE_INFINITY

    expect(() => auditExperience(album, entries, experience)).toThrow(/implausible duration/)
  })

  it('still rejects a zero duration', () => {
    const entries = [entry()]
    const experience = buildExperience(album, entries)
    experience.segments[0].durationSeconds = 0

    expect(() => auditExperience(album, entries, experience)).toThrow(/bad duration/)
  })
})
