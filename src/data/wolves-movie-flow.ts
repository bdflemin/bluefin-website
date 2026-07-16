export type MovieStage = 'intro' | 'playlist' | 'creator-shorts'

export interface WolvesMovieFlowState {
  stage: MovieStage
  playlistIndex: number
  resumePlaylistIndex: number | null
  shortsConsumed: boolean
}

export type WolvesMovieFlowEvent
  = | { type: 'intro-completed' }
    | { type: 'playlist-index-changed', playlistIndex: number }
    | { type: 'creator-shorts-completed' }
    | { type: 'reset' }

export function createWolvesMovieFlowState(): WolvesMovieFlowState {
  return {
    stage: 'intro',
    playlistIndex: 0,
    resumePlaylistIndex: null,
    shortsConsumed: false,
  }
}

export function reduceWolvesMovieFlow(
  state: WolvesMovieFlowState,
  event: WolvesMovieFlowEvent,
): WolvesMovieFlowState {
  if (event.type === 'reset') {
    return createWolvesMovieFlowState()
  }

  if (event.type === 'intro-completed') {
    return { ...state, stage: 'playlist' }
  }

  if (event.type === 'creator-shorts-completed') {
    return {
      ...state,
      stage: 'playlist',
      playlistIndex: state.resumePlaylistIndex ?? state.playlistIndex,
      resumePlaylistIndex: null,
    }
  }

  if (!Number.isInteger(event.playlistIndex) || event.playlistIndex < 0) {
    return state
  }

  if (state.stage === 'intro') {
    return state
  }

  if (
    state.stage === 'playlist'
    && state.playlistIndex === 0
    && event.playlistIndex === 1
    && !state.shortsConsumed
  ) {
    return {
      ...state,
      stage: 'creator-shorts',
      playlistIndex: event.playlistIndex,
      resumePlaylistIndex: event.playlistIndex,
      shortsConsumed: true,
    }
  }

  return {
    ...state,
    stage: state.stage === 'creator-shorts' ? state.stage : 'playlist',
    playlistIndex: event.playlistIndex,
  }
}
