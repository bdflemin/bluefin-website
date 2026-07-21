import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDualBufferPlayer } from '@/composables/useDualBufferPlayer'
import { resetYoutubeIframeApiCacheForTests } from '@/composables/useYoutubeIframeApi'
import { CINEMATIC_SEGMENTS, PRE_END_THRESHOLD_S, TIME_POLL_MS } from '@/config/wolves-cinematic'
import { useCinematicStore } from '@/stores/cinematic'

interface FakeEvents {
  onReady?: (event: unknown) => void
  onStateChange?: (event: { data: number }) => void
  onError?: (event: unknown) => void
}

interface FakePlayerOptions {
  events?: FakeEvents
  playerVars?: {
    origin?: string
    autohide?: number
  }
}

class FakePlayer {
  static instances: FakePlayer[] = []
  static emitPlayingOnPlay = true
  static emitReadyOnConstruct = true
  events: FakeEvents
  currentTime = 0
  duration = 0
  volume = 100
  playing = false
  loadedId = ''
  cuedId = ''
  destroyed = false
  options: FakePlayerOptions

  constructor(_element: Element, options: FakePlayerOptions) {
    this.options = options
    this.events = options.events ?? {}
    FakePlayer.instances.push(this)
    // The real API fires onReady asynchronously after construction.
    if (FakePlayer.emitReadyOnConstruct) {
      queueMicrotask(() => this.events.onReady?.({}))
    }
  }

  playVideo() {
    this.playing = true
    if (FakePlayer.emitPlayingOnPlay) {
      this.events.onStateChange?.({ data: 1 })
    }
  }

  pauseVideo() {
    this.playing = false
    this.events.onStateChange?.({ data: 2 })
  }

  loadVideoById(video: string | { videoId: string, startSeconds?: number }) {
    this.loadedId = typeof video === 'string' ? video : video.videoId
    this.currentTime = typeof video === 'string' ? 0 : video.startSeconds ?? 0
    this.playVideo()
  }

  cueVideoById(video: string | { videoId: string, startSeconds?: number }) {
    this.cuedId = typeof video === 'string' ? video : video.videoId
  }

  getCurrentTime() {
    return this.currentTime
  }

  getDuration() {
    return this.duration
  }

  getVolume() {
    return this.volume
  }

  setVolume(volume: number) {
    this.volume = volume
  }

  mute() {
    this.volume = 0
  }

  destroy() {
    this.destroyed = true
    this.playing = false
  }
}

function installFakeYoutubeApi() {
  ;(window as any).YT = {
    Player: FakePlayer,
    PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 },
  }
}

async function startPlayer() {
  const store = useCinematicStore()
  if (store.phase === 'lobby') {
    store.enterCinematic()
  }
  const hostA = ref<HTMLElement | null>(document.createElement('div'))
  const hostB = ref<HTMLElement | null>(document.createElement('div'))
  const player = useDualBufferPlayer({ hostA, hostB })
  await player.start()
  // onReady fires on a microtask; flush it.
  await Promise.resolve()
  return player
}

describe('useDualBufferPlayer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    FakePlayer.instances = []
    FakePlayer.emitPlayingOnPlay = true
    FakePlayer.emitReadyOnConstruct = true
    installFakeYoutubeApi()
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    resetYoutubeIframeApiCacheForTests()
    delete (window as any).YT
  })

  it('cues the first two segments before starting side A', async () => {
    const player = await startPlayer()
    const [playerA, playerB] = FakePlayer.instances

    expect(player.activeSide.value).toBe('a')
    expect(playerA.cuedId).toBe(CINEMATIC_SEGMENTS[0].youtubeId)
    expect(playerB.cuedId).toBe(CINEMATIC_SEGMENTS[1].youtubeId)
    expect(playerA.playing).toBe(true)
    expect(playerB.playing).toBe(true)
    expect(playerB.volume).toBe(0)
  })

  it('identifies the current origin to YouTube for both buffers', async () => {
    await startPlayer()

    expect(FakePlayer.instances).toHaveLength(2)
    expect(FakePlayer.instances.every(player => player.options.playerVars?.origin === window.location.origin)).toBe(true)
  })

  it('waits for the preloaded first side to play before completing startup', async () => {
    FakePlayer.emitPlayingOnPlay = false
    const hostA = ref<HTMLElement | null>(document.createElement('div'))
    const hostB = ref<HTMLElement | null>(document.createElement('div'))
    const player = useDualBufferPlayer({ hostA, hostB })
    await player.prepare()

    const start = player.start()
    let settled = false
    void start.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    FakePlayer.instances[0].events.onStateChange?.({ data: 1 })
    await start
    expect(settled).toBe(true)
  })

  it('settles pending startup and destroys the prepared buffers on teardown', async () => {
    FakePlayer.emitPlayingOnPlay = false
    const hostA = ref<HTMLElement | null>(document.createElement('div'))
    const hostB = ref<HTMLElement | null>(document.createElement('div'))
    const player = useDualBufferPlayer({ hostA, hostB })
    await player.prepare()

    const start = player.start()
    player.destroy()
    await start

    expect(FakePlayer.instances.every(instance => instance.destroyed)).toBe(true)
  })

  it('stops active playback and polling when the stage is torn down for intro navigation', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    const [playerA] = FakePlayer.instances
    playerA.currentTime = 12
    playerA.duration = 100
    vi.advanceTimersByTime(TIME_POLL_MS)
    expect(store.segmentElapsed).toBe(12)

    player.destroy()
    playerA.currentTime = 48
    vi.advanceTimersByTime(TIME_POLL_MS)

    expect(playerA.playing).toBe(false)
    expect(store.segmentElapsed).toBe(12)
  })

  it('destroys locally constructed players when unmounted before they become ready', async () => {
    FakePlayer.emitReadyOnConstruct = false
    const hostA = ref<HTMLElement | null>(document.createElement('div'))
    const hostB = ref<HTMLElement | null>(document.createElement('div'))
    const player = useDualBufferPlayer({ hostA, hostB })

    const prepare = player.prepare()
    await Promise.resolve()
    await Promise.resolve()
    expect(FakePlayer.instances).toHaveLength(2)

    player.destroy()

    await expect(prepare).rejects.toThrow('destroyed')
    expect(FakePlayer.instances.every(instance => instance.destroyed)).toBe(true)
  })

  it('allows a fresh muted prewarm after cancelling an unready prepare', async () => {
    FakePlayer.emitReadyOnConstruct = false
    const hostA = ref<HTMLElement | null>(document.createElement('div'))
    const hostB = ref<HTMLElement | null>(document.createElement('div'))
    const player = useDualBufferPlayer({ hostA, hostB })

    const cancelledPrepare = player.prepare()
    await Promise.resolve()
    await Promise.resolve()
    player.destroy()
    await expect(cancelledPrepare).rejects.toThrow('destroyed')

    FakePlayer.emitReadyOnConstruct = true
    await player.prepare()

    expect(FakePlayer.instances).toHaveLength(4)
    expect(FakePlayer.instances.slice(2).every(instance => instance.cuedId.length > 0)).toBe(true)
  })

  it('resets to side A before the fresh intro-to-cinematic prewarm starts Part I', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    FakePlayer.instances[0].events.onStateChange?.({ data: 0 })
    vi.advanceTimersByTime(2000)
    expect(player.activeSide.value).toBe('b')

    player.destroy()
    store.enterIntro()
    await player.prepare()
    store.enterCinematic()
    await player.start()

    expect(player.activeSide.value).toBe('a')
    expect(FakePlayer.instances[2].playing).toBe(true)
    expect(FakePlayer.instances[2].cuedId).toBe(CINEMATIC_SEGMENTS[0].youtubeId)
  })

  it('rejects preparation and releases both sides when a player errors before ready', async () => {
    FakePlayer.emitReadyOnConstruct = false
    const hostA = ref<HTMLElement | null>(document.createElement('div'))
    const hostB = ref<HTMLElement | null>(document.createElement('div'))
    const player = useDualBufferPlayer({ hostA, hostB })

    const prepare = player.prepare()
    await Promise.resolve()
    await Promise.resolve()
    FakePlayer.instances[0].events.onError?.({})

    await expect(prepare).rejects.toThrow('failed before readiness')
    expect(FakePlayer.instances.every(instance => instance.destroyed)).toBe(true)
  })

  it('publishes time into the store while playing', async () => {
    await startPlayer()
    const store = useCinematicStore()
    const [playerA] = FakePlayer.instances

    playerA.currentTime = 42
    playerA.duration = 300
    vi.advanceTimersByTime(TIME_POLL_MS)

    expect(store.segmentElapsed).toBe(42)
    expect(store.segmentDuration).toBe(300)
  })

  it('crossfades directly from Part I to Part II', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    store.enterCinematic()
    const [playerA, playerB] = FakePlayer.instances

    playerA.duration = 200
    playerA.currentTime = 200 - PRE_END_THRESHOLD_S
    vi.advanceTimersByTime(TIME_POLL_MS)

    expect(store.phase).toBe('cinematic')
    expect(player.activeSide.value).toBe('b')
    expect(playerB.playing).toBe(true)
  })

  it('starts directly from a selected cinematic segment', async () => {
    const store = useCinematicStore()
    store.enterCinematic()
    store.segmentIndex = 1

    await startPlayer()
    const [playerA, playerB] = FakePlayer.instances

    expect(playerA.cuedId).toBe(CINEMATIC_SEGMENTS[1].youtubeId)
    expect(playerB.cuedId).toBe(CINEMATIC_SEGMENTS[2].youtubeId)
  })

  it('manual Next from Part I goes directly to Part II', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    store.enterCinematic()

    player.skip(1)

    expect(store.phase).toBe('cinematic')
    expect(player.activeSide.value).toBe('b')
    vi.advanceTimersByTime(2000)
    expect(store.segmentIndex).toBe(1)
  })

  it('skips forward and backward on manual command', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    const [playerA, playerB] = FakePlayer.instances

    store.updateTime(10, 300)
    player.skip(1)
    expect(player.activeSide.value).toBe('b')
    expect(playerB.loadedId).toBe(CINEMATIC_SEGMENTS[1].youtubeId)

    vi.advanceTimersByTime(2000)
    expect(store.segmentIndex).toBe(1)
    expect(playerA.cuedId).toBe(CINEMATIC_SEGMENTS[2].youtubeId)

    player.skip(-1)
    vi.advanceTimersByTime(2000)
    expect(player.activeSide.value).toBe('a')
    expect(playerA.loadedId).toBe(CINEMATIC_SEGMENTS[0].youtubeId)
    expect(store.segmentIndex).toBe(0)
  })

  it('ignores skips past the ends and while crossfading', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()

    player.skip(-1)
    expect(store.segmentIndex).toBe(0)
    expect(player.activeSide.value).toBe('a')

    player.skip(1)
    // Mid-crossfade, further skips are ignored.
    player.skip(1)
    vi.advanceTimersByTime(2000)
    expect(store.segmentIndex).toBe(1)
  })

  it('falls back to swapping on the ENDED event', async () => {
    const player = await startPlayer()
    const [playerA] = FakePlayer.instances

    playerA.events.onStateChange?.({ data: 0 })
    expect(player.activeSide.value).toBe('b')
  })

  it('supports authored trims when a segment defines a startSeconds/endSeconds window', async () => {
    // No current segment is trimmed; pin a temporary authored window on segment 1
    // to keep the trim capability covered. The runtime reads the store's active
    // experience segments, so the window is pinned there.
    const segment = useCinematicStore().segments[1] as { startSeconds?: number, endSeconds?: number }
    segment.startSeconds = 2
    segment.endSeconds = 114
    try {
      const player = await startPlayer()
      const store = useCinematicStore()
      const [playerA, playerB] = FakePlayer.instances

      playerA.duration = 100
      playerA.currentTime = 100
      vi.advanceTimersByTime(TIME_POLL_MS)
      vi.advanceTimersByTime(2000)
      expect(store.segmentIndex).toBe(1)
      expect(player.activeSide.value).toBe('b')

      playerB.duration = 120
      playerB.currentTime = 50
      vi.advanceTimersByTime(TIME_POLL_MS)
      expect(store.nativeTime).toBe(50)
      expect(store.segmentElapsed).toBe(48)
      expect(store.segmentDuration).toBe(112)

      // The authored cutoff at 114s triggers the swap before the video's natural 120s end.
      playerB.currentTime = 114 - PRE_END_THRESHOLD_S
      vi.advanceTimersByTime(TIME_POLL_MS)
      expect(player.activeSide.value).toBe('a')
    }
    finally {
      delete segment.startSeconds
      delete segment.endSeconds
    }
  })

  it('finishes the cinematic when the last segment ends', async () => {
    const player = await startPlayer()
    const store = useCinematicStore()
    // Walk every boundary to the end of the seven-segment show.
    for (let i = 0; i < CINEMATIC_SEGMENTS.length - 1; i++) {
      const active = player.activeSide.value === 'a' ? FakePlayer.instances[0] : FakePlayer.instances[1]
      // Past both the natural duration and any authored endSeconds cutoff.
      active.duration = 1000
      active.currentTime = 1000
      vi.advanceTimersByTime(TIME_POLL_MS)
      vi.advanceTimersByTime(3000)
    }
    expect(store.segmentIndex).toBe(CINEMATIC_SEGMENTS.length - 1)

    const active = player.activeSide.value === 'a' ? FakePlayer.instances[0] : FakePlayer.instances[1]
    active.duration = 1000
    active.currentTime = 1000
    vi.advanceTimersByTime(TIME_POLL_MS)

    expect(store.phase).toBe('cinematic')
    expect(store.playing).toBe(false)

    player.skip(-1)
    vi.advanceTimersByTime(3000)
    expect(store.segmentIndex).toBe(CINEMATIC_SEGMENTS.length - 2)
  })

  it('destroys both players on teardown', async () => {
    const player = await startPlayer()
    player.destroy()
    expect(FakePlayer.instances.every(instance => instance.destroyed)).toBe(true)
  })
})
