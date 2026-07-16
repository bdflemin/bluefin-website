import { describe, expect, it } from 'vitest'
import {
  createWolvesMovieFlowState,
  reduceWolvesMovieFlow,
} from '../data/wolves-movie-flow'

describe('wolves movie flow', () => {
  it('starts in the intro stage', () => {
    expect(createWolvesMovieFlowState().stage).toBe('intro')
  })

  it('moves from intro to playlist when the prologue completes', () => {
    const state = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'intro-completed',
    })

    expect(state.stage).toBe('playlist')
    expect(state.playlistIndex).toBe(0)
  })

  it('ignores playlist index changes while still in the intro', () => {
    const state = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'playlist-index-changed',
      playlistIndex: 1,
    })

    expect(state.stage).toBe('intro')
    expect(state.playlistIndex).toBe(0)
  })

  it('opens Creator Shorts once when Track 0 advances to Track 1', () => {
    const atPlaylist = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'intro-completed',
    })
    const playingTrackZero = reduceWolvesMovieFlow(atPlaylist, {
      type: 'playlist-index-changed',
      playlistIndex: 0,
    })
    const transition = reduceWolvesMovieFlow(playingTrackZero, {
      type: 'playlist-index-changed',
      playlistIndex: 1,
    })

    expect(transition.stage).toBe('creator-shorts')
    expect(transition.resumePlaylistIndex).toBe(1)
    expect(transition.shortsConsumed).toBe(true)
  })

  it('reconciles playlist index changes while the Creator Shorts interstitial is active', () => {
    const atPlaylist = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'intro-completed',
    })
    const afterShorts = reduceWolvesMovieFlow(
      reduceWolvesMovieFlow(atPlaylist, {
        type: 'playlist-index-changed',
        playlistIndex: 0,
      }),
      {
        type: 'playlist-index-changed',
        playlistIndex: 1,
      },
    )

    expect(afterShorts.stage).toBe('creator-shorts')

    const reconciled = reduceWolvesMovieFlow(afterShorts, {
      type: 'playlist-index-changed',
      playlistIndex: 2,
    })

    expect(reconciled.stage).toBe('creator-shorts')
    expect(reconciled.playlistIndex).toBe(2)
  })

  it('returns to the saved playlist index after Creator Shorts complete', () => {
    const atPlaylist = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'intro-completed',
    })
    const afterShorts = reduceWolvesMovieFlow(
      reduceWolvesMovieFlow(atPlaylist, {
        type: 'playlist-index-changed',
        playlistIndex: 0,
      }),
      {
        type: 'playlist-index-changed',
        playlistIndex: 1,
      },
    )

    const resumed = reduceWolvesMovieFlow(afterShorts, {
      type: 'creator-shorts-completed',
    })

    expect(resumed.stage).toBe('playlist')
    expect(resumed.playlistIndex).toBe(1)
    expect(resumed.resumePlaylistIndex).toBeNull()
  })

  it('does not reopen Creator Shorts after native playlist back and forward navigation', () => {
    const afterShorts = {
      ...createWolvesMovieFlowState(),
      stage: 'playlist' as const,
      playlistIndex: 1,
      shortsConsumed: true,
    }

    const trackZero = reduceWolvesMovieFlow(afterShorts, {
      type: 'playlist-index-changed',
      playlistIndex: 0,
    })
    const trackOne = reduceWolvesMovieFlow(trackZero, {
      type: 'playlist-index-changed',
      playlistIndex: 1,
    })

    expect(trackZero.stage).toBe('playlist')
    expect(trackOne.stage).toBe('playlist')
  })

  it('ignores negative or non-integer playlist indices', () => {
    const state = reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
      type: 'playlist-index-changed',
      playlistIndex: -1,
    })
    expect(state.playlistIndex).toBe(0)

    const fractional = reduceWolvesMovieFlow(state, {
      type: 'playlist-index-changed',
      playlistIndex: 1.5,
    })
    expect(fractional.playlistIndex).toBe(0)
  })

  it('resets to the initial intro state', () => {
    const midFlow = reduceWolvesMovieFlow(
      reduceWolvesMovieFlow(createWolvesMovieFlowState(), {
        type: 'intro-completed',
      }),
      {
        type: 'playlist-index-changed',
        playlistIndex: 1,
      },
    )

    const reset = reduceWolvesMovieFlow(midFlow, { type: 'reset' })

    expect(reset).toEqual(createWolvesMovieFlowState())
  })
})
