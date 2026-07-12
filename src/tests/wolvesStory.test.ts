import { describe, expect, it } from 'vitest'
import interceptedCommunications from '../data/intercepted-communications.json'
import { wolvesRelease } from '../data/wolves-story'
import { getArtifactsForChapter, getChapterForPage, getNewArtifactIds } from '../utils/wolvesStory'

describe('wolves story manifest', () => {
  it('assigns every comic page to exactly one chapter', () => {
    expect(getChapterForPage(1)?.id).toBe('prologue')
    expect(getChapterForPage(15)?.id).toBe('awakening')
    expect(getChapterForPage(16)).toBeUndefined()
  })

  it('keeps archive artifacts in their chapter order', () => {
    expect(getArtifactsForChapter('prologue').map(artifact => artifact.id))
      .toEqual(['forbidden-factory', 'maintenance-window'])
  })

  it('identifies artifacts added after a stored release', () => {
    expect(getNewArtifactIds('2026-07-11-r1')).toEqual([])
    expect(getNewArtifactIds('unknown-release')).toEqual(wolvesRelease.artifacts.map(artifact => artifact.id))
  })

  it('has manifest artifacts for all intercepted communication titles', () => {
    const interceptedTitles = interceptedCommunications.map((comm: any) => comm.title)
    const artifactTitles = wolvesRelease.artifacts.map(artifact => artifact.title)

    for (const title of interceptedTitles) {
      expect(artifactTitles).toContain(title)
    }
  })
})
