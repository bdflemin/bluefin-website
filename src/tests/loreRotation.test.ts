import { describe, expect, it } from 'vitest'
import { shuffleLoreEntries } from '../utils/loreRotation'

describe('shuffleLoreEntries', () => {
  it('returns every lore entry once in the shuffled order', () => {
    const entries = ['quote-a', 'chat-a', 'quote-b', 'chat-b']
    const shuffled = shuffleLoreEntries(entries, () => 0)

    expect(shuffled).toEqual(['chat-a', 'quote-b', 'chat-b', 'quote-a'])
    expect(shuffled).toHaveLength(entries.length)
    expect(shuffled).toEqual(expect.arrayContaining(entries))
    expect(entries).toEqual(['quote-a', 'chat-a', 'quote-b', 'chat-b'])
  })
})
