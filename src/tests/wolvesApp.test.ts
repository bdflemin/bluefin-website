import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WolvesApp from '../WolvesApp.vue'

vi.mock('../components/TopNavbar.vue', () => ({
  default: { template: '<div>TopNavbar</div>' },
}))

vi.mock('../components/wolves/WolvesComicReader.vue', () => ({
  default: {
    props: ['chapters', 'autoplay', 'fastPacing'],
    emits: ['update:page'],
    template: '<button class="comic-reader" @click="$emit(`update:page`, 8)">WolvesComicReader</button>',
  },
}))

vi.mock('../components/wolves/WolvesSoundtrack.vue', () => ({
  default: {
    props: ['playing', 'chapter', 'loreCopied'],
    emits: ['progress'],
    template: '<div class="soundtrack-chapter">{{ chapter?.id ?? `none` }}</div>',
  },
}))

vi.mock('../components/wolves/WolvesLoreColumn.vue', () => ({
  default: {
    props: ['chapter'],
    template: '<div class="lore-chapter">{{ chapter?.id ?? `none` }}</div>',
  },
}))

vi.mock('../components/wolves/WolvesQrCodes.vue', () => ({
  default: {
    template: '<div class="wolves-qr-codes">WolvesQrCodes</div>',
  },
}))

describe('wolvesApp.vue', () => {
  it('renders the page title, bottom QR section, and has experience button', () => {
    const wrapper = mount(WolvesApp)

    expect(wrapper.text()).toContain('Seven Days to the Wolves')
    expect(wrapper.find('.wolves-page-qr').exists()).toBe(true)
    expect(wrapper.find('.wolves-qr-codes').exists()).toBe(true)
    expect(wrapper.find('.experience-cta-btn').exists()).toBe(true)
  })

  it('passes the active chapter to soundtrack and lore in immersive mode', async () => {
    const wrapper = mount(WolvesApp)

    // Initially immersive elements are not rendered
    expect(wrapper.find('.comic-reader').exists()).toBe(false)

    // Click button to enter immersive mode
    await wrapper.find('.experience-cta-btn').trigger('click')

    // Now elements are rendered
    expect(wrapper.find('.comic-reader').exists()).toBe(true)
    expect(wrapper.find('.soundtrack-chapter').text()).toBe('none')
    expect(wrapper.find('.lore-chapter').text()).toBe('none')
  })

  it('activates fast pacing when first song progress passes 3:21 (201s)', async () => {
    const wrapper = mount(WolvesApp)

    await wrapper.find('.experience-cta-btn').trigger('click')

    const soundtrack = wrapper.findComponent({ name: 'WolvesSoundtrack' })
    const reader = wrapper.findComponent({ name: 'WolvesComicReader' })

    expect(reader.props('fastPacing')).toBeFalsy()

    // Emit progress event
    await soundtrack.vm.$emit('progress', { currentTime: 205, duration: 300, playlistIndex: 0 })

    expect(reader.props('fastPacing')).toBe(true)
  })
})
