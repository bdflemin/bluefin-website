import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WolvesLoreColumn from '../components/wolves/WolvesLoreColumn.vue'

describe('wolvesLoreColumn Logic', () => {
  it('renders the artifact selected by the soundtrack timeline', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'arthur-c-clarke-3',
        duration: 20,
      },
    })

    vi.advanceTimersByTime(5_000)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('It is a bitter thought, but you must face it.')
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
