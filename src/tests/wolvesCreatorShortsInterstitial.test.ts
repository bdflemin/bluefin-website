import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resetYoutubeIframeApiCacheForTests } from '../composables/useYoutubeIframeApi'
import { wolvesCreatorShorts } from '../data/wolves-creator-shorts'

const { default: WolvesCreatorShortsInterstitial } = await import('../components/wolves/WolvesCreatorShortsInterstitial.vue')

const iframeApiSrc = 'https://www.youtube.com/iframe_api'

interface MockPlayerRecord {
  config: any
  videoId: string
  destroy: ReturnType<typeof vi.fn>
  triggerEnded: () => void
  triggerError: () => void
}

let players: MockPlayerRecord[] = []

function installMockIframeApi() {
  class MockPlayer {
    config: any
    videoId: string
    destroy = vi.fn()

    constructor(element: Element, config: any) {
      this.config = config
      this.videoId = config.videoId
      const mountNode = element as HTMLElement
      if (!mountNode.parentElement) {
        throw new Error('MockPlayer target must stay attached')
      }
      players.push(this as unknown as MockPlayerRecord)
    }

    triggerEnded() {
      this.config.events?.onStateChange?.({ data: (window as any).YT.PlayerState.ENDED, target: this })
    }

    triggerError() {
      this.config.events?.onError?.({ target: this })
    }
  }

  ;(window as any).YT = {
    Player: MockPlayer,
    PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
  }
}

function resolveIframeApi() {
  installMockIframeApi()
  ;(window as any).onYouTubeIframeAPIReady?.()
}

function interstitialVisible() {
  // Teleported to document.body — see docs/skills/wolves-fullscreen-overlays.md.
  return document.body.querySelector('.wolves-creator-shorts-interstitial') !== null
}

beforeEach(() => {
  players = []
  ;(window as any).happyDOM.settings.handleDisabledFileLoadingAsSuccess = true
  document.head.querySelectorAll(`script[src="${iframeApiSrc}"]`).forEach(script => script.remove())
  delete (window as any).YT
  delete (window as any).onYouTubeIframeAPIReady
  resetYoutubeIframeApiCacheForTests()
})

afterEach(() => {
  document.body.querySelectorAll('.wolves-creator-shorts-interstitial').forEach(node => node.remove())
  document.head.querySelectorAll(`script[src="${iframeApiSrc}"]`).forEach(script => script.remove())
  delete (window as any).YT
  delete (window as any).onYouTubeIframeAPIReady
  resetYoutubeIframeApiCacheForTests()
  vi.clearAllMocks()
})

describe('wolvesCreatorShortsInterstitial', () => {
  it('teleports to body and starts with the first (Lindsay Nikole) short', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    expect(interstitialVisible()).toBe(true)
    expect(players).toHaveLength(1)
    expect(players[0].videoId).toBe(wolvesCreatorShorts[0].videoId)
    expect(document.body.querySelector('.wolves-creator-shorts-interstitial-credit')?.textContent).toContain('Lindsay Nikole')
  })

  it('advances through the alternating list as each short ends', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    players[0].triggerEnded()
    await flushPromises()
    await nextTick()

    expect(players).toHaveLength(2)
    expect(players[1].videoId).toBe(wolvesCreatorShorts[1].videoId)
    expect(document.body.querySelector('.wolves-creator-shorts-interstitial-credit')?.textContent).toContain('Cassidy Williams')
  })

  it('emits complete after the last short ends, without looping back to the first', async () => {
    const wrapper = mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    for (let i = 0; i < wolvesCreatorShorts.length - 1; i++) {
      players[players.length - 1].triggerEnded()
      await flushPromises()
      await nextTick()
    }

    expect(players).toHaveLength(wolvesCreatorShorts.length)
    expect(wrapper.emitted('complete')).toBeUndefined()

    players[players.length - 1].triggerEnded()
    await flushPromises()
    await nextTick()

    // The component emits `complete` and leaves the unmount decision to its parent
    // (WolvesSoundtrack.vue's `v-if`), so it does not remove itself here.
    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('never blocks the feed when a short errors', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    players[0].triggerError()
    await flushPromises()
    await nextTick()

    expect(players).toHaveLength(2)
    expect(document.body.querySelector('.wolves-creator-shorts-interstitial-credit')?.textContent).toContain('Cassidy Williams')
  })
})
