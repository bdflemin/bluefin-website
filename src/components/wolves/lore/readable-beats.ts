const SENTENCE_PATTERN = /[^.!?…]+(?:[.!?…]+(?=\s|$)|$)/g

/**
 * Titles and initials that end in a period without ending a sentence. Without
 * these, "Dr. Andy Anderson" splits after "Dr." and the name lands on the next
 * page — which is how the death reveal in the closing bulletin got cut in half.
 */
const ABBREVIATION_ENDING = /(?:^|\s)(?:Dr|Mr|Mrs|Ms|Messrs|Prof|Sr|Jr|St|Lt|Sgt|Capt|Cmdr|Gen|Col|Maj|Rev|Hon|Pres|Gov|Sen|Rep|Inc|Ltd|Co|Corp|Dept|Est|vs|etc|al|approx|No|Fig|Vol|Ch|pp|Ave|Blvd|Mt|Ft|[A-Z])\.$/

/** A token that already began as "Title. Name", so the name run continues. */
const TITLED_NAME_RUN = /(?:^|\s)[A-Z][a-z]*\.\s[A-Z]/

/**
 * Rejoin sentence fragments that were split at an abbreviation's period. A beat
 * must never end on a title, so the name it introduces stays with it.
 */
function mergeAbbreviationSplits(sentences: readonly string[]): string[] {
  const merged: string[] = []

  for (const sentence of sentences) {
    const previous = merged[merged.length - 1]
    if (previous !== undefined && ABBREVIATION_ENDING.test(previous)) {
      merged[merged.length - 1] = `${previous} ${sentence}`
    }
    else {
      merged.push(sentence)
    }
  }

  return merged
}

/**
 * Fuse a title with the capitalised name that follows it into one unbreakable
 * token, so "Dr. Andy Anderson" is laid out as a single unit and can never be
 * dealt across two pages.
 */
function fuseTitledNames(words: readonly string[]): string[] {
  const fused: string[] = []

  for (const word of words) {
    const previous = fused[fused.length - 1]
    const continuesName = previous !== undefined
      && (ABBREVIATION_ENDING.test(previous) || TITLED_NAME_RUN.test(previous))
      && /^[A-Z]/.test(word)

    if (continuesName) {
      fused[fused.length - 1] = `${previous} ${word}`
    }
    else {
      fused.push(word)
    }
  }

  return fused
}

function splitLongSentence(sentence: string, maximumCharacters: number): string[] {
  const words = fuseTitledNames(sentence.trim().split(/\s+/).filter(Boolean))
  const beats: string[] = []
  let beat = ''

  for (const word of words) {
    const candidate = beat ? `${beat} ${word}` : word
    if (beat && candidate.length > maximumCharacters) {
      beats.push(beat)
      beat = word
    }
    else {
      beat = candidate
    }
  }

  if (beat) {
    beats.push(beat)
  }

  return beats
}

export function splitReadableBeats(text: string, maximumCharacters: number): string[] {
  const matched = text.match(SENTENCE_PATTERN)?.map(sentence => sentence.trim()).filter(Boolean) ?? []
  const sentences = mergeAbbreviationSplits(matched)
  const source = sentences.length > 0 ? sentences : [text.trim()]
  const beats: string[] = []
  let beat = ''

  for (const sentence of source) {
    const units = sentence.length > maximumCharacters
      ? splitLongSentence(sentence, maximumCharacters)
      : [sentence]

    for (const unit of units) {
      const candidate = beat ? `${beat} ${unit}` : unit
      if (beat && candidate.length > maximumCharacters) {
        beats.push(beat)
        beat = unit
      }
      else {
        beat = candidate
      }
    }
  }

  if (beat) {
    beats.push(beat)
  }

  return beats
}
