import type { WolvesSoundtrackManifest } from '../data/wolves-soundtrack'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { loadWolvesSoundtrack } = vi.hoisted(() => ({
  loadWolvesSoundtrack: vi.fn<() => Promise<WolvesSoundtrackManifest>>(),
}))

vi.mock('../data/wolves-soundtrack', () => ({
  loadWolvesSoundtrack,
}))

const { default: WolvesSoundtrack } = await import('../components/wolves/WolvesSoundtrack.vue')

const soundtrackManifest: WolvesSoundtrackManifest = {
  source: {
    provider: 'youtube',
    playlistId: 'PLA78oiE-RGAE',
    playlistUrl: 'https://www.youtube.com/playlist?list=PLA78oiE-RGAE',
    musicUrl: 'https://music.youtube.com/playlist?list=PLA78oiE-RGAE',
    spotifyUri: null,
  },
  tracks: [
    {
      id: 'LASru9j0oIc',
      title: '7 Days to the Wolves',
      artist: 'Nightwish',
      artwork: 'wolves-artwork/LASru9j0oIc.jpg',
      youtubeVideoId: 'LASru9j0oIc',
    },
    {
      id: 'amKIngGUvCk',
      title: 'Ghosts In The Mist',
      artist: 'Unleash The Archers',
      artwork: 'wolves-artwork/amKIngGUvCk.jpg',
      youtubeVideoId: 'amKIngGUvCk',
    },
  ],
}

const iframeApiSrc = 'https://www.youtube.com/iframe_api'

interface MockPlayerRecord {
  config: any
  element: Element | string
  playlistIndex: number
  playVideo: ReturnType<typeof vi.fn>
  pauseVideo: ReturnType<typeof vi.fn>
  getPlaylistIndex: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  triggerReady: () => void
  triggerPlaylistItem: (index: number) => void
  triggerError: () => void
}

let players: MockPlayerRecord[] = []

function installMockIframeApi() {
  class MockPlayer {
    config: any
    element: Element | string
    playlistIndex = 0
    playVideo = vi.fn(() => {
      this.config.events?.onStateChange?.({
        data: (window as any).YT.PlayerState.PLAYING,
        target: this,
      })
    })

    pauseVideo = vi.fn(() => {
      this.config.events?.onStateChange?.({
        data: (window as any).YT.PlayerState.PAUSED,
        target: this,
      })
    })

    getPlaylistIndex = vi.fn(() => this.playlistIndex)
    destroy = vi.fn()

    constructor(element: Element | string, config: any) {
      this.element = element
      this.config = config
      players.push(this as unknown as MockPlayerRecord)
    }

    triggerReady() {
      this.config.events?.onReady?.({ target: this })
    }

    triggerPlaylistItem(index: number) {
      this.playlistIndex = index
      this.config.events?.onPlaylistItem?.({ target: this })
    }

    triggerError() {
      this.config.events?.onError?.({ target: this })
    }
  }

  ;(window as any).YT = {
    Player: MockPlayer,
    PlayerState: {
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5,
    },
  }
}

function resolveIframeApi() {
  installMockIframeApi()
  ;(window as any).onYouTubeIframeAPIReady?.()
}

function mockIframeApiFailure() {
  const script = document.querySelector(`script[src="${iframeApiSrc}"]`)
  expect(script).not.toBeNull()
  script?.dispatchEvent(new Event('error'))
}

beforeEach(() => {
  loadWolvesSoundtrack.mockResolvedValue(soundtrackManifest)
  players = []
  ;(window as any).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true
  document.body.className = ''
  document.head.querySelectorAll(`script[src="${iframeApiSrc}"]`).forEach(script => script.remove())
  delete (window as any).YT
  delete (window as any).onYouTubeIframeAPIReady
})

afterEach(() => {
  document.body.className = ''
  document.head.querySelectorAll(`script[src="${iframeApiSrc}"]`).forEach(script => script.remove())
  delete (window as any).YT
  delete (window as any).onYouTubeIframeAPIReady
  vi.clearAllMocks()
})

describe('wolves soundtrack', () => {
  it('does not request the IFrame API until Start Soundtrack is clicked', async () => {
    const wrapper = mount(WolvesSoundtrack)

    expect(loadWolvesSoundtrack).not.toHaveBeenCalled()
    expect(document.querySelector(`script[src="${iframeApiSrc}"]`)).toBeNull()

    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    await flushPromises()

    expect(loadWolvesSoundtrack).toHaveBeenCalledTimes(1)
    expect(document.querySelector(`script[src="${iframeApiSrc}"]`)).not.toBeNull()
  })

  it('keeps the same player while unrelated reader events occur', async () => {
    const wrapper = mount(WolvesSoundtrack)

    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    await flushPromises()

    resolveIframeApi()
    await flushPromises()
    players[0].triggerReady()
    await flushPromises()

    const playerNode = wrapper.get('[data-testid="wolves-player-host"]').element

    await wrapper.setProps({})

    expect(wrapper.get('[data-testid="wolves-player-host"]').element).toBe(playerNode)
    expect(players).toHaveLength(1)
  })

  it('updates the displayed track from playlist events instead of chapter props', async () => {
    const wrapper = mount(WolvesSoundtrack)

    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    await flushPromises()

    resolveIframeApi()
    await flushPromises()
    players[0].triggerReady()
    await flushPromises()

    expect(wrapper.text()).toContain('7 Days to the Wolves')
    expect(wrapper.text()).toContain('Nightwish')

    players[0].triggerPlaylistItem(1)
    await flushPromises()

    expect(wrapper.text()).toContain('Ghosts In The Mist')
    expect(wrapper.text()).toContain('Unleash The Archers')
  })

  it('shows the music link and Premium notice when playback cannot initialize', async () => {
    const wrapper = mount(WolvesSoundtrack)

    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    await flushPromises()

    mockIframeApiFailure()
    await flushPromises()

    expect(wrapper.text()).toContain('Ad-free playback requires YouTube Premium')
    expect(wrapper.get('a[aria-label="Open soundtrack in YouTube Music"]').attributes('href')).toContain('music.youtube.com')
  })

  it('retries with a replacement player after a player error', async () => {
    const wrapper = mount(WolvesSoundtrack)

    await wrapper.get('button[aria-label="Start soundtrack"]').trigger('click')
    await flushPromises()

    resolveIframeApi()
    await flushPromises()

    const failedHost = wrapper.get('[data-testid="wolves-player-host"]').element
    players[0].triggerError()
    await flushPromises()

    expect(wrapper.text()).toContain('Playback could not initialize here.')

    await wrapper.get('.soundtrack-action').trigger('click')
    await flushPromises()

    expect(players[0].destroy).toHaveBeenCalledTimes(1)
    expect(players).toHaveLength(2)
    expect(wrapper.get('[data-testid="wolves-player-host"]').element).not.toBe(failedHost)

    players[1].triggerReady()
    await flushPromises()

    expect(players[1].playVideo).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Persistent soundtrack playback is active for this session.')
  })
})
