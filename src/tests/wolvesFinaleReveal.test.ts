import { describe, expect, it } from 'vitest'
import { loreProsePages, pickPageIndexForElapsed } from '../components/wolves/lore/lore-pages'
import { loadAllLoreRecords } from '../data/wolves-lore-records'
import { wolvesNarrativeTimeline } from '../data/wolves-narrative-timeline'
import { getWolvesThesisState } from '../data/wolves-thesis-sequence'
import { TRACK_ZERO_SECTIONS } from '../data/wolves-track-zero-beats'

const FINAL_ID = 'blue-universal-acquires-wayland-yutani'
const BEAT = TRACK_ZERO_SECTIONS.finaleStart

function finalSlot() {
  const slot = wolvesNarrativeTimeline.find(entry => entry.artifactId === FINAL_ID)
  expect(slot, 'closing bulletin is missing from the timeline').toBeDefined()
  return slot!
}

function pageAt(time: number) {
  const slot = finalSlot()
  const record = loadAllLoreRecords().find(entry => entry.id === FINAL_ID)!
  const pages = loreProsePages(record.body)
  const index = pickPageIndexForElapsed(pages, time - slot.startTime, slot.endTime - slot.startTime)
  return pages[index]!
}

// The finale is the one moment in the show where music and text must agree:
// the audience reads that the doctor is dead on the same beat the score says
// Become Legend. Both sides are derived from TRACK_ZERO_SECTIONS.finaleStart,
// and these tests fail if either drifts off it.
describe('finale reveal', () => {
  it('turns up the death reveal exactly on the finale beat', () => {
    expect(pageAt(BEAT)).toContain('Dr. Andy Anderson')
  })

  it('still holds the setup a moment before the beat', () => {
    expect(pageAt(BEAT - 0.25)).not.toContain('Dr. Andy Anderson')
  })

  it('fires Become Legend on the same beat', () => {
    expect(getWolvesThesisState(BEAT).text).toBe('Become Legend')
    expect(getWolvesThesisState(BEAT - 0.25).text).not.toBe('Become Legend')
  })

  it('keeps the doctor title and name on one page', () => {
    const record = loadAllLoreRecords().find(entry => entry.id === FINAL_ID)!
    for (const page of loreProsePages(record.body)) {
      expect(page.trimEnd(), 'a page ends on a title, orphaning the name').not.toMatch(/\bDr\.$/)
    }
    expect(loreProsePages(record.body).some(page => page.includes('Dr. Andy Anderson'))).toBe(true)
  })

  it('gives the closing bulletin room for every authored page', () => {
    const slot = finalSlot()
    const record = loadAllLoreRecords().find(entry => entry.id === FINAL_ID)!
    const pages = loreProsePages(record.body)
    const last = pageAt(slot.endTime - 0.1)

    expect(last).toContain('truly a great loss for humanity')
    expect(last).toBe(pages[pages.length - 1])
  })
})
