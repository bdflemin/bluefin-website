import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WolvesSoundtrack from '../components/wolves/WolvesSoundtrack.vue'

describe('wolves soundtrack (nowPlayingBar design)', () => {
  it('renders playlist title and metadata when standby', () => {
    const wrapper = mount(WolvesSoundtrack, {
      props: {
        chapter: undefined,
        playing: false,
      },
    })

    expect(wrapper.text()).toContain('RELEASE SOUNDTRACK TO HUNT BY')
    expect(wrapper.text()).toContain('7 Days to the Wolves')
    expect(wrapper.text()).toContain('Nightwish')
    expect(wrapper.text()).toContain('Dark Passion Play')
    expect(wrapper.find('iframe').exists()).toBe(false)
  })

  it('renders iframe when playing is true', () => {
    const wrapper = mount(WolvesSoundtrack, {
      props: {
        chapter: undefined,
        playing: true,
      },
    })

    expect(wrapper.find('iframe').exists()).toBe(true)
    expect(wrapper.find('iframe').attributes('src')).toContain('youtube.com/embed/videoseries')
    expect(wrapper.find('iframe').attributes('src')).toContain('list=PLA78oiE-RGAE')
  })

  it('emits update:playing event when clicking the play button', async () => {
    const wrapper = mount(WolvesSoundtrack, {
      props: {
        chapter: undefined,
        playing: false,
      },
    })

    await wrapper.find('.play-button').trigger('click')
    expect(wrapper.emitted('update:playing')).toBeTruthy()
    expect(wrapper.emitted('update:playing')?.[0]).toEqual([true])
  })
})
