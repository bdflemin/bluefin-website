import { describe, expect, it } from 'vitest'
import { loreEntries } from '../components/wolves/lore'

describe('wolves Lore Parser', () => {
  it('should parse legacy single-newline speaker blocks correctly (The Garden Before Time)', () => {
    const ishtar = loreEntries.find(
      e => e.type === 'conversation' && e.data.title === 'The Garden Before Time'
    )

    expect(ishtar).toBeDefined()
    if (ishtar && ishtar.type === 'conversation') {
      // It should have multiple messages, not just 1 monolithic block
      expect(ishtar.data.messages.length).toBeGreaterThan(1)
      expect(ishtar.data.messages[0].speaker).toBe('THE GARDENER')
      expect(ishtar.data.messages[0].text).toBe('I plant possibilities and watch what they become.')
      expect(ishtar.data.messages[1].speaker).toBe('THE WINNOWER')
      expect(ishtar.data.messages[1].text).toBe('I separate what can endure from what cannot.')
    }
  })

  it('should correctly parse <SFX> single-newline blocks', () => {
    // We mock a conversation that would be parsed to verify the regex locally if needed,
    // but testing against the real loreEntries is a good integration test.
    const theChildren = loreEntries.find(
      e => e.type === 'conversation' && e.data.title === 'The Children'
    )
    expect(theChildren).toBeDefined()
    if (theChildren && theChildren.type === 'conversation') {
      // Check that SFX are present somewhere
      const hasSfx = theChildren.data.messages.some(m => m.isSfx)
      expect(hasSfx).toBe(true)
    }
  })
})
