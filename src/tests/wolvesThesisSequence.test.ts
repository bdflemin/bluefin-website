import { describe, expect, it } from 'vitest'
import {
  getWolvesThesisState,
  wolvesIncomingSignalMessages,
} from '../data/wolves-thesis-sequence'

const THESIS_START_SECONDS = 345
const PHRASE_SECONDS = 8 * 60 / 152

describe('wolves thesis sequence', () => {
  it('reads ordered non-empty messages from the editable source', () => {
    expect(wolvesIncomingSignalMessages).toEqual([
      'We\'ve got your back.',
      'You\'ll never walk alone.',
      'We are Universal Blue.',
      'Evolve or die.',
      'You have ascended.',
      'Become Legend',
    ])
  })

  it('cycles a message every eight beats from the Universal Blue HUD change', () => {
    expect(getWolvesThesisState(THESIS_START_SECONDS).text).toBe(wolvesIncomingSignalMessages[0])
    expect(getWolvesThesisState(THESIS_START_SECONDS + PHRASE_SECONDS - 0.001).text).toBe(wolvesIncomingSignalMessages[0])
    expect(getWolvesThesisState(THESIS_START_SECONDS + PHRASE_SECONDS).text).toBe(wolvesIncomingSignalMessages[1])
    expect(getWolvesThesisState(THESIS_START_SECONDS + PHRASE_SECONDS * wolvesIncomingSignalMessages.length).text).toBe(wolvesIncomingSignalMessages[0])
  })

  it('preserves the approved thesis window, HUD, and visual modes', () => {
    expect(getWolvesThesisState(344.999).active).toBe(false)
    expect(getWolvesThesisState(345)).toMatchObject({
      active: true,
      mode: 'welcome',
      dayPulse: true,
      hudLabel: 'Incoming Signal: Universal Blue',
    })
    expect(getWolvesThesisState(365)).toMatchObject({
      active: true,
      mode: 'corruption',
      hudLabel: 'Incoming Signal: Universal Blue',
    })
    expect(getWolvesThesisState(395)).toMatchObject({ active: true, mode: 'growing-corruption' })
    expect(getWolvesThesisState(405)).toMatchObject({
      active: true,
      mode: 'legend',
      warning: 'truly a great loss for humanity.',
    })
    expect(getWolvesThesisState(425).active).toBe(true)
    expect(getWolvesThesisState(425.001).active).toBe(false)
  })
})
