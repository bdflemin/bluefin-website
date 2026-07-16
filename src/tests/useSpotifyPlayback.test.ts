import type { SpotifyPlaybackDependencies, SpotifyWebPlaybackPlayer } from '../composables/useSpotifyPlayback'
import { describe, expect, it, vi } from 'vitest'
import { useSpotifyPlayback } from '../composables/useSpotifyPlayback'

const trackUris = ['spotify:track:first', 'spotify:track:second'] as const

function createHarness() {
  const listeners = new Map<string, (value: any) => void>()
  const player: SpotifyWebPlaybackPlayer = {
    addListener: vi.fn((event, callback) => listeners.set(event, callback)),
    connect: vi.fn(async () => true),
    disconnect: vi.fn(),
    nextTrack: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    previousTrack: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    seek: vi.fn(async () => {}),
    setVolume: vi.fn(async () => {}),
  }
  const Player = vi.fn(class MockSpotifyPlayer {
    constructor() {
      return player
    }
  })
  let time = 1_000
  let tick: (() => void) | undefined
  const fetch = vi.fn(async () => new Response(null, { status: 204 }))
  const dependencies: SpotifyPlaybackDependencies = {
    fetch,
    loadSdk: async () => ({ Player }),
    now: () => time,
    setInterval: (callback) => {
      tick = callback
      return 1 as unknown as ReturnType<typeof setInterval>
    },
    clearInterval: vi.fn(),
  }

  return {
    dependencies,
    emit: (event: string, value: unknown) => listeners.get(event)?.(value),
    fetch,
    player,
    setTime: (value: number) => { time = value },
    tick: () => tick?.(),
  }
}

async function startAndReady(
  playback: ReturnType<typeof useSpotifyPlayback>,
  harness: ReturnType<typeof createHarness>,
) {
  const starting = playback.start()
  await Promise.resolve()
  harness.emit('ready', { device_id: 'device-123' })
  await starting
}

describe('spotify Wolves playback', () => {
  it('transfers to the SDK device before starting the exact ordered URI list', async () => {
    const harness = createHarness()
    const playback = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress: vi.fn(),
      dependencies: harness.dependencies,
    })

    await startAndReady(playback, harness)

    expect(harness.fetch).toHaveBeenNthCalledWith(1, 'https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_ids: ['device-123'], play: false }),
    })
    expect(harness.fetch).toHaveBeenNthCalledWith(2, 'https://api.spotify.com/v1/me/player/play?device_id=device-123', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: trackUris }),
    })
  })

  it('uses state events as the 100ms progress clock without polling the SDK', async () => {
    const harness = createHarness()
    const onProgress = vi.fn()
    const playback = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress,
      dependencies: harness.dependencies,
    })

    await startAndReady(playback, harness)
    harness.emit('player_state_changed', {
      position: 345_000,
      duration: 423_000,
      paused: false,
      track_window: { current_track: { uri: trackUris[0] } },
    })
    harness.setTime(1_100)
    harness.tick()

    expect(onProgress).toHaveBeenNthCalledWith(1, { currentTime: 345, duration: 423, playlistIndex: 0 })
    expect(onProgress).toHaveBeenNthCalledWith(2, { currentTime: 345.1, duration: 423, playlistIndex: 0 })
    expect(harness.player).not.toHaveProperty('getCurrentState')
  })

  it('stops the clock and reports a controlled error for an unmapped SDK URI', async () => {
    const harness = createHarness()
    const playback = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress: vi.fn(),
      dependencies: harness.dependencies,
    })

    await startAndReady(playback, harness)
    harness.emit('player_state_changed', {
      position: 1,
      duration: 10,
      paused: false,
      track_window: { current_track: { uri: trackUris[0] } },
    })
    harness.emit('player_state_changed', {
      position: 1,
      duration: 10,
      paused: false,
      track_window: { current_track: { uri: 'spotify:track:unmapped' } },
    })

    expect(playback.status.value).toBe('error')
    expect(playback.error.value).toMatchObject({ code: 'unmapped-track' })
    expect(harness.dependencies.clearInterval).toHaveBeenCalled()
  })

  it('stops progress when the SDK reports no active state', async () => {
    const harness = createHarness()
    const playback = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress: vi.fn(),
      dependencies: harness.dependencies,
    })

    await startAndReady(playback, harness)
    harness.emit('player_state_changed', {
      position: 1,
      duration: 10,
      paused: false,
      track_window: { current_track: { uri: trackUris[0] } },
    })
    harness.emit('player_state_changed', null)

    expect(playback.status.value).toBe('paused')
    expect(harness.dependencies.clearInterval).toHaveBeenCalled()
  })

  it('distinguishes account eligibility and device readiness failures', async () => {
    const ineligibleHarness = createHarness()
    const ineligible = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress: vi.fn(),
      dependencies: ineligibleHarness.dependencies,
    })
    const ineligibleStart = ineligible.start()
    await Promise.resolve()
    ineligibleHarness.emit('account_error', { message: 'Premium required' })
    await expect(ineligibleStart).rejects.toMatchObject({ code: 'account-ineligible' })

    expect(ineligible.status.value).toBe('ineligible')
    expect(ineligible.error.value).toMatchObject({ code: 'account-ineligible' })

    const notReadyHarness = createHarness()
    const notReady = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress: vi.fn(),
      dependencies: notReadyHarness.dependencies,
    })
    const notReadyStart = notReady.start()
    await Promise.resolve()
    notReadyHarness.emit('not_ready', { device_id: 'device-123' })
    await expect(notReadyStart).rejects.toMatchObject({ code: 'device-not-ready' })

    expect(notReady.status.value).toBe('error')
    expect(notReady.error.value).toMatchObject({ code: 'device-not-ready' })
  })

  it('cleans up idempotently and ignores late SDK callbacks', async () => {
    const harness = createHarness()
    const onProgress = vi.fn()
    const playback = useSpotifyPlayback({
      accessToken: 'token',
      playlistUri: 'spotify:playlist:reviewed',
      trackUris,
      onProgress,
      dependencies: harness.dependencies,
    })

    await startAndReady(playback, harness)
    playback.destroy()
    playback.destroy()
    harness.emit('player_state_changed', {
      position: 1,
      duration: 10,
      paused: false,
      track_window: { current_track: { uri: trackUris[0] } },
    })

    expect(harness.player.disconnect).toHaveBeenCalledOnce()
    expect(onProgress).not.toHaveBeenCalled()
  })
})
