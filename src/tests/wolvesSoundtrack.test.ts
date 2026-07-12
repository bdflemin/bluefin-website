import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WolvesSoundtrack from '../components/wolves/WolvesSoundtrack.vue'

describe('wolves soundtrack', () => {
  it('does not create the player until the visitor starts the soundtrack', async () => {
    const wrapper = mount(WolvesSoundtrack, { props: { chapter: undefined } })

    expect(wrapper.find('iframe').exists()).toBe(false)
    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    expect(wrapper.find('iframe').attributes('src')).toContain('youtube.com/embed/videoseries')
  })
})
