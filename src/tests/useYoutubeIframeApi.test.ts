import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelPlayerVolumeFade, fadePlayerVolume } from '../composables/useYoutubeIframeApi'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  cancelPlayerVolumeFade()
  vi.useRealTimers()
})

describe('fadePlayerVolume', () => {
  it('fades from the current volume to the target volume over the duration', () => {
    const setVolume = vi.fn()
    const getVolume = vi.fn(() => 80)
    const onComplete = vi.fn()

    fadePlayerVolume({ setVolume, getVolume }, 40, 1000, onComplete)

    expect(onComplete).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)

    expect(setVolume).toHaveBeenLastCalledWith(40)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('defaults to a start volume of 100 when getVolume is absent', () => {
    const setVolume = vi.fn()

    fadePlayerVolume({ setVolume }, 60, 500)
    vi.advanceTimersByTime(500)

    expect(setVolume).toHaveBeenLastCalledWith(60)
  })

  it('completes immediately when the start volume already equals the target', () => {
    const setVolume = vi.fn()
    const getVolume = vi.fn(() => 70)
    const onComplete = vi.fn()

    fadePlayerVolume({ setVolume, getVolume }, 70, 500, onComplete)

    expect(setVolume).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('falls back cleanly when setVolume is absent', () => {
    const onComplete = vi.fn()

    fadePlayerVolume({}, 40, 1000, onComplete)

    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('cancels a previous fade when a new one starts', () => {
    const setVolume = vi.fn()
    const onCompleteA = vi.fn()
    const onCompleteB = vi.fn()

    fadePlayerVolume({ setVolume }, 10, 1000, onCompleteA)
    fadePlayerVolume({ setVolume }, 90, 500, onCompleteB)

    vi.advanceTimersByTime(500)

    expect(onCompleteA).not.toHaveBeenCalled()
    expect(onCompleteB).toHaveBeenCalledOnce()
    expect(setVolume).toHaveBeenLastCalledWith(90)
  })
})
