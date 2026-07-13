import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WolvesApp from '../WolvesApp.vue'

vi.mock('../data/wolves-soundtrack', () => ({
  loadWolvesSoundtrack: vi.fn().mockResolvedValue({
    source: { provider: 'youtube', playlistId: 'test' },
    tracks: [],
  }),
}))

vi.mock('../components/TopNavbar.vue', () => ({
  default: { template: '<div>TopNavbar</div>' },
}))

vi.mock('../components/wolves/WolvesComicReader.vue', () => ({
  default: {
    props: ['trackIndex', 'playlistCurrentTime'],
    template: '<div class="comic-reader">WolvesComicReader</div>',
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
    props: ['artifactId', 'duration'],
    template: '<div class="lore-artifact">{{ artifactId }}</div>',
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

  it('passes the timeline-selected artifact to lore in immersive mode', async () => {
    const wrapper = mount(WolvesApp)

    // Initially immersive elements are not rendered
    expect(wrapper.find('.comic-reader').exists()).toBe(false)

    // Click button to enter immersive mode
    await wrapper.find('.experience-cta-btn').trigger('click')

    // Now elements are rendered
    expect(wrapper.find('.comic-reader').exists()).toBe(true)
    expect(wrapper.find('.lore-artifact').text()).toBe('arthur-c-clarke-4')

    const soundtrack = wrapper.findComponent({ name: 'WolvesSoundtrack' })
    await soundtrack.vm.$emit('progress', { currentTime: 180, duration: 423, playlistIndex: 0 })

    expect(wrapper.find('.lore-artifact').text()).toBe('lorem-pursuit-1')
  })
})
