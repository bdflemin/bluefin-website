import type { WolvesSoundtrackManifest } from '../data/wolves-soundtrack'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loadWolvesSoundtrack } = vi.hoisted(() => ({
  loadWolvesSoundtrack: vi.fn<() => Promise<WolvesSoundtrackManifest>>(),
}))
const spotifyMock = vi.hoisted(() => ({
  catalog: [] as Array<{
    youtubeVideoId: string
    spotifyUri: `spotify:track:${string}`
    title: string
    artist: string
  }>,
  controller: null as any,
  events: [] as string[],
  startStatus: 'playing' as 'playing' | 'ineligible',
}))

vi.mock('../data/wolves-soundtrack', () => ({
  loadWolvesSoundtrack,
}))
vi.mock('../data/wolves-spotify-catalog', () => ({
  wolvesSpotifyCatalog: spotifyMock.catalog,
}))
vi.mock('../data/wolves-intro-sequence', () => ({
  buildIntroVideoSequence: () => [],
}))
vi.mock('../components/wolves/WolvesIntroOverlay.vue', () => ({
  default: { template: '<div />' },
}))
vi.mock('../components/wolves/WolvesCreatorShortsInterstitial.vue', () => ({
  default: { template: '<button data-test="complete-shorts" @click="$emit(\'complete\')" />' },
}))
vi.mock('../composables/useSpotifyAuth', () => ({
  useSpotifyAuth: () => ({ accessToken: { value: 'token' } }),
}))
vi.mock('../composables/useSpotifyPlayback', async () => {
  const { ref } = await import('vue')
  return {
    useSpotifyPlayback: vi.fn((options) => {
      const controller = {
        destroy: vi.fn(),
        error: ref(null),
        next: vi.fn(),
        pause: vi.fn(() => {
          spotifyMock.events.push('pause')
          return Promise.resolve()
        }),
        previous: vi.fn(),
        resume: vi.fn(() => {
          spotifyMock.events.push('resume')
          return Promise.resolve()
        }),
        seek: vi.fn(),
        setVolume: vi.fn((volume: number) => {
          spotifyMock.events.push(`volume:${volume}`)
          return Promise.resolve()
        }),
        start: vi.fn(async () => {
          controller.status.value = spotifyMock.startStatus
          if (spotifyMock.startStatus === 'ineligible') {
            throw new Error('Premium required')
          }
        }),
        status: ref<'loading' | 'playing' | 'ineligible'>('loading'),
      }
      spotifyMock.controller = { controller, options }
      return controller
    }),
  }
})

const { default: WolvesSoundtrack } = await import('../components/wolves/WolvesSoundtrack.vue')

describe('wolves soundtrack Spotify selection', () => {
  beforeEach(() => {
    spotifyMock.catalog.splice(0)
    spotifyMock.controller = null
    spotifyMock.events.splice(0)
    spotifyMock.startStatus = 'playing'
  })

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

  it('keeps account eligibility failures distinct from catalog unavailability', async () => {
    spotifyMock.catalog.push({
      youtubeVideoId: 'video',
      spotifyUri: 'spotify:track:reviewed',
      title: 'Track',
      artist: 'Artist',
    })
    spotifyMock.startStatus = 'ineligible'
    loadWolvesSoundtrack.mockResolvedValue({
      source: {
        provider: 'youtube',
        playlistId: 'playlist',
        playlistUrl: 'https://youtube.example/playlist',
        musicUrl: 'https://youtube.example/music',
        spotifyUri: 'spotify:playlist:reviewed',
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

    expect(wrapper.text()).toContain('Spotify Premium playback is required for this account.')
    expect(wrapper.text()).not.toContain('reviewed catalog mappings are loaded')
  })

  it('fades Spotify for 600ms before pausing and after resuming Shorts', async () => {
    vi.useFakeTimers()
    try {
      spotifyMock.catalog.push(
        {
          youtubeVideoId: 'video-one',
          spotifyUri: 'spotify:track:one',
          title: 'Track One',
          artist: 'Artist',
        },
        {
          youtubeVideoId: 'video-two',
          spotifyUri: 'spotify:track:two',
          title: 'Track Two',
          artist: 'Artist',
        },
      )
      loadWolvesSoundtrack.mockResolvedValue({
        source: {
          provider: 'youtube',
          playlistId: 'playlist',
          playlistUrl: 'https://youtube.example/playlist',
          musicUrl: 'https://youtube.example/music',
          spotifyUri: 'spotify:playlist:reviewed',
        },
        tracks: [
          {
            id: 'track-one',
            title: 'Track One',
            artist: 'Artist',
            artwork: 'artwork-one.jpg',
            youtubeVideoId: 'video-one',
          },
          {
            id: 'track-two',
            title: 'Track Two',
            artist: 'Artist',
            artwork: 'artwork-two.jpg',
            youtubeVideoId: 'video-two',
          },
        ],
      })

      const wrapper = mount(WolvesSoundtrack, {
        props: { playing: true, provider: 'spotify', skipIntro: true },
      })
      await flushPromises()
      spotifyMock.controller.options.onProgress({
        currentTime: 0,
        duration: 100,
        playlistIndex: 1,
      })
      await flushPromises()

      await vi.advanceTimersByTimeAsync(599)
      expect(spotifyMock.controller.controller.pause).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(1)
      expect(spotifyMock.controller.controller.pause).toHaveBeenCalledOnce()

      await wrapper.get('[data-test="complete-shorts"]').trigger('click')
      expect(spotifyMock.events.slice(-2)).toEqual(['volume:0', 'resume'])
      await vi.advanceTimersByTimeAsync(50)
      expect(spotifyMock.events.at(-1)).not.toBe('resume')
      wrapper.unmount()
    }
    finally {
      vi.useRealTimers()
    }
  })
})
