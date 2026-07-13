import { wolvesRelease } from './wolves-story'

export interface WolvesNarrativeSlot {
  artifactId: string
  startTime: number
  endTime: number
}

const MIDDLE_ARTIFACT_INDEX = 9
const FINAL_ARTIFACT_INDEX = wolvesRelease.artifacts.length - 1
const MIDDLE_START_TIME = 180
const MIDDLE_END_TIME = 220
const FINAL_START_TIME = 398
const TRACK_END_TIME = 423

export const wolvesNarrativeTimeline: WolvesNarrativeSlot[] = wolvesRelease.artifacts.map((artifact, index) => {
  if (index < MIDDLE_ARTIFACT_INDEX) {
    const duration = MIDDLE_START_TIME / MIDDLE_ARTIFACT_INDEX
    return {
      artifactId: artifact.id,
      startTime: index * duration,
      endTime: (index + 1) * duration,
    }
  }

  if (index === MIDDLE_ARTIFACT_INDEX) {
    return {
      artifactId: artifact.id,
      startTime: MIDDLE_START_TIME,
      endTime: MIDDLE_END_TIME,
    }
  }

  if (index < FINAL_ARTIFACT_INDEX) {
    const duration = (FINAL_START_TIME - MIDDLE_END_TIME) / (FINAL_ARTIFACT_INDEX - MIDDLE_ARTIFACT_INDEX - 1)
    return {
      artifactId: artifact.id,
      startTime: MIDDLE_END_TIME + (index - MIDDLE_ARTIFACT_INDEX - 1) * duration,
      endTime: MIDDLE_END_TIME + (index - MIDDLE_ARTIFACT_INDEX) * duration,
    }
  }

  return {
    artifactId: artifact.id,
    startTime: FINAL_START_TIME,
    endTime: TRACK_END_TIME,
  }
})

export function getNarrativeSlotForTime(time: number): WolvesNarrativeSlot {
  const normalizedTime = Math.max(0, time)
  return wolvesNarrativeTimeline.find(slot => normalizedTime < slot.endTime)
    ?? wolvesNarrativeTimeline[wolvesNarrativeTimeline.length - 1]
}
