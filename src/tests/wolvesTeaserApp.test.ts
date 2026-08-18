import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { TRAILER_PICTURE_END_SECONDS } from '@/data/wolves-trailer-plates'
import WolvesTeaserApp from '@/WolvesTeaserApp.vue'

vi.mock('@/composables/useYoutubeIframeApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/composables/useYoutubeIframeApi')>()
  return {
    ...actual,
    loadYoutubeIframeApi: () => Promise.resolve(),
    getYoutubePlayerConstructor: () => class FakePlayer {
      currentTime = 0

      seekTo(seconds: number) {
        this.currentTime = seconds
      }

      getCurrentTime() {
        return this.currentTime
      }

      playVideo() {}
      pauseVideo() {}
      destroy() {}
    },
  }
})

interface TeaserHarness {
  seekTo: (seconds: number) => void
}

describe('wolves teaser bridge', () => {
  afterEach(() => {
    delete (window as typeof window & { __wolvesTeaser?: TeaserHarness }).__wolvesTeaser
  })

  it('keeps an opaque black backing over the YouTube picture while the wolf-day wallpaper rises', async () => {
    const wrapper = mount(WolvesTeaserApp, {
      global: {
        stubs: {
          MediaWidget: true,
          WolvesBackCatalogue: true,
          WolvesTrailerLine: true,
        },
      },
    })
    await flushPromises()

    const harness = (window as typeof window & { __wolvesTeaser: TeaserHarness }).__wolvesTeaser
    harness.seekTo(TRAILER_PICTURE_END_SECONDS - 0.01)
    await nextTick()
    expect(wrapper.find('.wt-backdrop').exists()).toBe(false)

    harness.seekTo(TRAILER_PICTURE_END_SECONDS)
    await nextTick()

    const backdrop = wrapper.get<HTMLElement>('.wt-backdrop')
    const wallpaperGroup = wrapper.get<HTMLElement>('.wt-backdrop-images')
    const [day, night] = wrapper.findAll<HTMLElement>('.wt-backdrop-img')
    expect(backdrop.element.style.opacity).toBe('')
    expect(wallpaperGroup.element.style.opacity).toBe('0')
    expect(day.element.style.opacity).toBe('')
    expect(night.element.style.opacity).toBe('0')

    harness.seekTo(TRAILER_PICTURE_END_SECONDS + 0.6)
    await nextTick()

    expect(Number(wallpaperGroup.element.style.opacity)).toBeCloseTo(0.6 / 1.4, 5)
    expect(night.element.style.opacity).toBe('0')

    harness.seekTo(TRAILER_PICTURE_END_SECONDS + 4.6)
    await nextTick()

    expect(wallpaperGroup.element.style.opacity).toBe('1')
    expect(Number(night.element.style.opacity)).toBeCloseTo(0.5, 5)

    harness.seekTo(TRAILER_PICTURE_END_SECONDS + 11.1)
    await nextTick()

    expect(Number(wallpaperGroup.element.style.opacity)).toBeCloseTo(0.5, 5)
    expect(night.element.style.opacity).toBe('1')

    wrapper.unmount()
  })
})
