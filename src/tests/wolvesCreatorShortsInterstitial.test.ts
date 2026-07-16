import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { resetYoutubeIframeApiCacheForTests } from '../composables/useYoutubeIframeApi'
import {
  wolvesCreatorShortsCassidyWilliams,
  wolvesCreatorShortsChapter,
  wolvesCreatorShortsLindsayNikole,
} from '../data/wolves-creator-shorts'

const { default: WolvesCreatorShortsInterstitial } = await import('../components/wolves/WolvesCreatorShortsInterstitial.vue')

const iframeApiSrc = 'https://www.youtube.com/iframe_api'

interface MockPlayerRecord {
  config: any
  videoId: string
  autoplay: boolean
  loadVideoById: ReturnType<typeof vi.fn>
  cueVideoById: ReturnType<typeof vi.fn>
  playVideo: ReturnType<typeof vi.fn>
  pauseVideo: ReturnType<typeof vi.fn>
  destroy: ReturnType<typeof vi.fn>
  triggerEnded: () => void
  triggerError: () => void
}

let players: MockPlayerRecord[] = []

function installMockIframeApi() {
  class MockPlayer {
    config: any
    videoId: string
    autoplay: boolean
    loadVideoById = vi.fn((id: string) => { this.videoId = id })
    cueVideoById = vi.fn((id: string) => { this.videoId = id })
    playVideo = vi.fn()
    pauseVideo = vi.fn()
    destroy = vi.fn()

    constructor(element: Element, config: any) {
      this.config = config
      this.videoId = config.videoId
      this.autoplay = config.playerVars?.autoplay === 1
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

function captionText(side: 'left' | 'right') {
  const slots = document.body.querySelectorAll('.wolves-creator-shorts-slot')
  const slot = side === 'left' ? slots[0] : slots[1]
  return slot?.querySelector('.wolves-creator-shorts-caption')?.textContent ?? ''
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
  it('defines one four-video chapter before Track 1 resumes', () => {
    expect(wolvesCreatorShortsChapter.map(short => short.videoId)).toEqual([
      wolvesCreatorShortsCassidyWilliams[0].videoId,
      wolvesCreatorShortsCassidyWilliams[1].videoId,
      wolvesCreatorShortsCassidyWilliams[2].videoId,
      wolvesCreatorShortsLindsayNikole[0].videoId,
    ])
  })

  it('teleports to body, creates exactly two persistent players, and starts with Cassidy Williams active', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    expect(interstitialVisible()).toBe(true)
    expect(players).toHaveLength(2)

    const [left, right] = players
    expect(left.videoId).toBe(wolvesCreatorShortsCassidyWilliams[0].videoId)
    expect(left.autoplay).toBe(true)
    expect(right.videoId).toBe(wolvesCreatorShortsLindsayNikole[0].videoId)
    expect(right.autoplay).toBe(false)

    expect(captionText('left')).toContain(wolvesCreatorShortsCassidyWilliams[0].title)
    expect(captionText('right')).toContain(wolvesCreatorShortsLindsayNikole[0].title)
  })

  it('holds Cassidy on the left for three lead videos before the first Lindsay turn', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    const [left, right] = players

    left.triggerEnded()
    await flushPromises()
    await nextTick()

    expect(players).toHaveLength(2)
    expect(right.playVideo).not.toHaveBeenCalled()
    expect(left.loadVideoById).toHaveBeenCalledWith(wolvesCreatorShortsCassidyWilliams[1].videoId)
    expect(captionText('left')).toContain(wolvesCreatorShortsCassidyWilliams[1].title)
    expect(captionText('right')).toContain(wolvesCreatorShortsLindsayNikole[0].title)

    left.triggerEnded()
    await flushPromises()
    await nextTick()

    expect(right.playVideo).not.toHaveBeenCalled()
    expect(left.loadVideoById).toHaveBeenCalledWith(wolvesCreatorShortsCassidyWilliams[2].videoId)
    expect(captionText('left')).toContain(wolvesCreatorShortsCassidyWilliams[2].title)

    left.triggerEnded()
    await flushPromises()
    await nextTick()

    expect(right.playVideo).toHaveBeenCalledTimes(1)
    expect(left.cueVideoById).toHaveBeenCalledWith(wolvesCreatorShortsCassidyWilliams[3].videoId)
    expect(captionText('left')).toContain(wolvesCreatorShortsCassidyWilliams[3].title)
    expect(captionText('right')).toContain(wolvesCreatorShortsLindsayNikole[0].title)
  })

  it('completes after three Cassidy videos and one Lindsay video', async () => {
    const wrapper = mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    const [left, right] = players

    left.triggerEnded()
    await flushPromises()
    left.triggerEnded()
    await flushPromises()
    left.triggerEnded()
    await flushPromises()
    right.triggerEnded()
    await flushPromises()

    expect(players).toHaveLength(2)
    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('continues to Track 1 when the final Lindsay video errors', async () => {
    const wrapper = mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    const [left, right] = players
    left.triggerEnded()
    await flushPromises()
    await nextTick()
    left.triggerEnded()
    await flushPromises()
    await nextTick()
    left.triggerEnded()
    await flushPromises()
    await nextTick()

    right.triggerError()
    await flushPromises()
    await nextTick()

    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('does not swap the active side when the still-inactive, preloaded side errors', async () => {
    mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    const [left, right] = players

    // Lindsay (right) is inactive/preloaded at this point -- an error on her cued video must
    // only skip that one broken entry, never hand control to her or restart Cassidy's turn.
    right.triggerError()
    await flushPromises()
    await nextTick()

    expect(right.cueVideoById).toHaveBeenCalledWith(wolvesCreatorShortsLindsayNikole[1].videoId)
    expect(right.playVideo).not.toHaveBeenCalled()
    expect(left.loadVideoById).not.toHaveBeenCalled()
    expect(captionText('left')).toContain(wolvesCreatorShortsCassidyWilliams[0].title)
  })

  it('completes the four-video chapter when Lindsay[0] errors preloaded and Lindsay[1] becomes the chapter turn', async () => {
    const wrapper = mount(WolvesCreatorShortsInterstitial)
    await flushPromises()
    resolveIframeApi()
    await flushPromises()

    const [left, right] = players

    right.triggerError()
    await flushPromises()
    await nextTick()

    left.triggerEnded()
    await flushPromises()
    await nextTick()
    left.triggerEnded()
    await flushPromises()
    await nextTick()
    left.triggerEnded()
    await flushPromises()
    await nextTick()

    expect(right.videoId).toBe(wolvesCreatorShortsLindsayNikole[1].videoId)
    expect(captionText('right')).toContain(wolvesCreatorShortsLindsayNikole[1].title)

    right.triggerEnded()
    await flushPromises()
    await nextTick()

    expect(wrapper.emitted('complete')).toHaveLength(1)
  })

  it('emits complete without ever mounting a player when the IFrame API fails to load entirely', async () => {
    document.head.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]').forEach(script => script.remove())
    delete (window as any).YT
    delete (window as any).onYouTubeIframeAPIReady

    const wrapper = mount(WolvesCreatorShortsInterstitial)
    await flushPromises()

    const script = document.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    expect(script).not.toBeNull()
    script?.dispatchEvent(new Event('error'))
    await flushPromises()

    expect(players).toHaveLength(0)
    expect(wrapper.emitted('complete')).toHaveLength(1)
  })
})
