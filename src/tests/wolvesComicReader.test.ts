import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WolvesComicReader from '../components/wolves/WolvesComicReader.vue'

describe('wolvesComicReader', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('wolves-playlist.json')) {
        return Promise.resolve(new Response(JSON.stringify({
          source: { provider: 'youtube', playlistId: '123' },
          tracks: [{ id: 'track0', title: 'Cover Track', artist: 'Artist 0', youtubeVideoId: '1' }],
        })))
      }
      if (url.includes('flickr-photos.json')) {
        return Promise.resolve(new Response(JSON.stringify([])))
      }
      return Promise.resolve(new Response(JSON.stringify({})))
    }))
  })

  it('renders the static cover before the soundtrack starts', () => {
    const wrapper = mount(WolvesComicReader)

    expect(wrapper.find('.cover-container img').attributes('src')).toContain('color-with-bluefin-cover.webp')
  })

  it('does not render manual page navigation', () => {
    const wrapper = mount(WolvesComicReader, {
      props: {
        trackIndex: 0,
        playlistCurrentTime: 180,
      },
    })

    expect(wrapper.find('button[aria-label="Previous page"]').exists()).toBe(false)
    expect(wrapper.find('button[aria-label="Next page"]').exists()).toBe(false)
  })
})
