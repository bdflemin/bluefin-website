import type { WolvesSoundtrackManifest } from '../data/wolves-soundtrack'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const { loadWolvesSoundtrack } = vi.hoisted(() => ({
  loadWolvesSoundtrack: vi.fn<() => Promise<WolvesSoundtrackManifest>>(),
}))

vi.mock('../data/wolves-soundtrack', () => ({
  loadWolvesSoundtrack,
}))
vi.mock('../data/wolves-intro-sequence', () => ({
  buildIntroVideoSequence: () => [],
}))
vi.mock('../components/wolves/WolvesIntroOverlay.vue', () => ({
  default: { template: '<div />' },
}))

const { default: WolvesSoundtrack } = await import('../components/wolves/WolvesSoundtrack.vue')

describe('wolves soundtrack Spotify selection', () => {
  it('keeps Spotify unavailable when the reviewed catalog does not validate against the manifest', async () => {
    loadWolvesSoundtrack.mockResolvedValue({
      source: {
        provider: 'youtube',
        playlistId: 'playlist',
        playlistUrl: 'https://youtube.example/playlist',
        musicUrl: 'https://youtube.example/music',
        spotifyUri: null,
      },
      tracks: [{
        id: 'track',
        title: 'Track',
        artist: 'Artist',
        artwork: 'artwork.jpg',
        youtubeVideoId: 'video',
      }],
    })
    const wrapper = mount(WolvesSoundtrack, {
      props: { playing: true, provider: 'spotify', skipIntro: true },
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Spotify playback is unavailable until reviewed catalog mappings are loaded.')
    expect(document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')).toBeNull()
  })
})
