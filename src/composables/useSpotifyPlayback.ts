import type { WolvesPlaybackProgress } from '@/data/wolves-playback'
import { ref } from 'vue'

const SPOTIFY_SDK_URL = 'https://sdk.scdn.co/spotify-player.js'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1/me/player'

export type SpotifyPlaybackStatus = 'loading' | 'ready' | 'playing' | 'paused' | 'ineligible' | 'error'
export type SpotifyPlaybackErrorCode = 'account-ineligible' | 'api-failed' | 'device-not-ready' | 'unmapped-track'

export class SpotifyPlaybackError extends Error {
  constructor(
    public readonly code: SpotifyPlaybackErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'SpotifyPlaybackError'
  }
}

export interface SpotifyPlaybackState {
  position: number
  duration: number
  paused: boolean
  track_window: {
    current_track: {
      uri: string
    }
  }
}

export interface SpotifyWebPlaybackPlayer {
  addListener: (event: string, callback: (value: any) => void) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  nextTrack: () => Promise<void>
  pause: () => Promise<void>
  previousTrack: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  setVolume: (volume: number) => Promise<void>
}

export interface SpotifyWebPlaybackSdk {
  Player: new (options: {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume: number
  }) => SpotifyWebPlaybackPlayer
}

export interface SpotifyPlaybackDependencies {
  fetch?: typeof window.fetch
  loadSdk?: () => Promise<SpotifyWebPlaybackSdk>
  now?: () => number
  setInterval?: (callback: () => void, delay: number) => ReturnType<typeof setInterval>
  clearInterval?: (timer: ReturnType<typeof setInterval>) => void
}

export interface SpotifyPlaybackOptions {
  accessToken: string
  playlistUri: string
  trackUris: readonly string[]
  onProgress: (progress: WolvesPlaybackProgress) => void
  dependencies?: SpotifyPlaybackDependencies
}

let spotifySdkPromise: Promise<SpotifyWebPlaybackSdk> | null = null

function loadSpotifySdk(): Promise<SpotifyWebPlaybackSdk> {
  if (typeof window === 'undefined') {
    return Promise.reject(new SpotifyPlaybackError('api-failed', 'Spotify playback is only available in a browser'))
  }

  const spotifyWindow = window as Window & {
    Spotify?: SpotifyWebPlaybackSdk
    onSpotifyWebPlaybackSDKReady?: () => void
  }
  if (spotifyWindow.Spotify?.Player) {
    return Promise.resolve(spotifyWindow.Spotify)
  }
  if (spotifySdkPromise) {
    return spotifySdkPromise
  }

  spotifySdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const previousReady = spotifyWindow.onSpotifyWebPlaybackSDKReady

    spotifyWindow.onSpotifyWebPlaybackSDKReady = () => {
      previousReady?.()
      if (spotifyWindow.Spotify?.Player) {
        resolve(spotifyWindow.Spotify)
      }
      else {
        reject(new SpotifyPlaybackError('api-failed', 'Spotify Web Playback SDK did not provide a player'))
      }
    }
    script.src = SPOTIFY_SDK_URL
    script.async = true
    script.addEventListener('error', () => reject(new SpotifyPlaybackError('api-failed', 'Spotify Web Playback SDK failed to load')))
    document.head.appendChild(script)
  }).catch((error) => {
    spotifySdkPromise = null
    throw error
  })

  return spotifySdkPromise
}

function toProgress(state: SpotifyPlaybackState, trackUris: readonly string[]): WolvesPlaybackProgress {
  const playlistIndex = trackUris.indexOf(state.track_window.current_track.uri)
  if (playlistIndex < 0) {
    throw new SpotifyPlaybackError(
      'unmapped-track',
      `Spotify emitted a track outside the reviewed Wolves catalog: ${state.track_window.current_track.uri}`,
    )
  }
  return {
    currentTime: Math.max(0, state.position / 1000),
    duration: Math.max(0, state.duration / 1000),
    playlistIndex,
  }
}

export function useSpotifyPlayback(options: SpotifyPlaybackOptions) {
  const status = ref<SpotifyPlaybackStatus>('loading')
  const error = ref<SpotifyPlaybackError | null>(null)
  const dependencies = options.dependencies ?? {}
  const fetcher = dependencies.fetch ?? window.fetch.bind(window)
  const now = dependencies.now ?? Date.now
  const schedule = dependencies.setInterval ?? setInterval
  const cancelSchedule = dependencies.clearInterval ?? clearInterval
  let player: SpotifyWebPlaybackPlayer | null = null
  let deviceId: string | null = null
  let progressTimer: ReturnType<typeof setInterval> | null = null
  let latestProgress: WolvesPlaybackProgress | null = null
  let receivedAt = 0
  let destroyed = false
  let deviceReady: Promise<string> | null = null
  let resolveDeviceReady: ((deviceId: string) => void) | null = null
  let rejectDeviceReady: ((error: SpotifyPlaybackError) => void) | null = null

  function stopProgressTimer(): void {
    if (progressTimer) {
      cancelSchedule(progressTimer)
      progressTimer = null
    }
  }

  function emitExtrapolatedProgress(): void {
    if (!latestProgress) {
      return
    }
    const elapsedSeconds = Math.max(0, now() - receivedAt) / 1000
    options.onProgress({
      ...latestProgress,
      currentTime: Math.min(latestProgress.duration, latestProgress.currentTime + elapsedSeconds),
    })
  }

  function startProgressTimer(): void {
    if (progressTimer) {
      return
    }
    progressTimer = schedule(emitExtrapolatedProgress, 100)
  }

  function reportFailure(failure: SpotifyPlaybackError): void {
    if (destroyed) {
      return
    }
    stopProgressTimer()
    latestProgress = null
    error.value = failure
    status.value = failure.code === 'account-ineligible' ? 'ineligible' : 'error'
    rejectDeviceReady?.(failure)
    rejectDeviceReady = null
    resolveDeviceReady = null
  }

  function handlePlayerState(state: SpotifyPlaybackState | null): void {
    if (destroyed) {
      return
    }
    if (!state) {
      stopProgressTimer()
      latestProgress = null
      if (status.value !== 'error' && status.value !== 'ineligible') {
        status.value = 'paused'
      }
      return
    }

    try {
      latestProgress = toProgress(state, options.trackUris)
      receivedAt = now()
      emitExtrapolatedProgress()
      if (state.paused) {
        stopProgressTimer()
        status.value = 'paused'
      }
      else {
        status.value = 'playing'
        startProgressTimer()
      }
    }
    catch (caught) {
      reportFailure(caught instanceof SpotifyPlaybackError
        ? caught
        : new SpotifyPlaybackError('api-failed', 'Spotify playback state could not be processed'))
    }
  }

  async function ensurePlayer(): Promise<void> {
    if (player) {
      return
    }
    const sdk = await (dependencies.loadSdk?.() ?? loadSpotifySdk())
    if (destroyed) {
      return
    }
    player = new sdk.Player({
      name: 'Bluefin Wolves',
      getOAuthToken: callback => callback(options.accessToken),
      volume: 1,
    })
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      if (destroyed || !device_id) {
        return
      }
      deviceId = device_id
      resolveDeviceReady?.(deviceId)
      resolveDeviceReady = null
      rejectDeviceReady = null
    })
    player.addListener('not_ready', () => reportFailure(
      new SpotifyPlaybackError('device-not-ready', 'Spotify playback device is not ready'),
    ))
    player.addListener('account_error', ({ message }: { message?: string }) => reportFailure(
      new SpotifyPlaybackError('account-ineligible', message ?? 'Spotify Premium playback is required'),
    ))
    player.addListener('authentication_error', ({ message }: { message?: string }) => reportFailure(
      new SpotifyPlaybackError('account-ineligible', message ?? 'Spotify authorization is not eligible for playback'),
    ))
    player.addListener('initialization_error', ({ message }: { message?: string }) => reportFailure(
      new SpotifyPlaybackError('api-failed', message ?? 'Spotify playback could not initialize'),
    ))
    player.addListener('playback_error', ({ message }: { message?: string }) => reportFailure(
      new SpotifyPlaybackError('api-failed', message ?? 'Spotify playback failed'),
    ))
    player.addListener('player_state_changed', handlePlayerState)
    const connected = await player.connect()
    if (!connected) {
      throw new SpotifyPlaybackError('api-failed', 'Spotify playback device could not connect')
    }
  }

  async function request(url: string, body: Record<string, unknown>): Promise<void> {
    const response = await fetcher(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${options.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new SpotifyPlaybackError('api-failed', `Spotify playback API returned ${response.status}`)
    }
  }

  async function start(): Promise<void> {
    if (destroyed) {
      return
    }
    if (!options.trackUris.length) {
      const failure = new SpotifyPlaybackError('api-failed', 'Spotify playback requires reviewed Wolves track URIs')
      reportFailure(failure)
      throw failure
    }

    status.value = 'loading'
    error.value = null
    deviceReady = new Promise<string>((resolve, reject) => {
      resolveDeviceReady = resolve
      rejectDeviceReady = reject
    })

    try {
      await ensurePlayer()
      const readyDeviceId = deviceId ?? await deviceReady
      if (destroyed) {
        return
      }
      await request(SPOTIFY_API_URL, { device_ids: [readyDeviceId], play: false })
      await request(`${SPOTIFY_API_URL}/play?device_id=${encodeURIComponent(readyDeviceId)}`, { uris: options.trackUris })
      if (status.value === 'loading') {
        status.value = 'ready'
      }
    }
    catch (caught) {
      const failure = caught instanceof SpotifyPlaybackError
        ? caught
        : new SpotifyPlaybackError('api-failed', 'Spotify playback could not start')
      reportFailure(failure)
      throw failure
    }
  }

  function pause(): Promise<void> {
    return player?.pause() ?? Promise.resolve()
  }

  function resume(): Promise<void> {
    return player?.resume() ?? Promise.resolve()
  }

  function seek(seconds: number): Promise<void> {
    return player?.seek(Math.max(0, seconds) * 1000) ?? Promise.resolve()
  }

  function previous(): Promise<void> {
    return player?.previousTrack() ?? Promise.resolve()
  }

  function next(): Promise<void> {
    return player?.nextTrack() ?? Promise.resolve()
  }

  function setVolume(volume: number): Promise<void> {
    return player?.setVolume(Math.max(0, Math.min(100, volume)) / 100) ?? Promise.resolve()
  }

  function destroy(): void {
    if (destroyed) {
      return
    }
    destroyed = true
    stopProgressTimer()
    latestProgress = null
    player?.disconnect()
    player = null
    resolveDeviceReady = null
    rejectDeviceReady = null
  }

  return {
    destroy,
    error,
    next,
    pause,
    previous,
    resume,
    seek,
    setVolume,
    start,
    status,
  }
}
