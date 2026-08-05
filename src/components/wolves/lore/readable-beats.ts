const SENTENCE_PATTERN = /[^.!?…]+(?:[.!?…]+(?=\s|$)|$)/g

function splitLongSentence(sentence: string, maximumCharacters: number): string[] {
  const words = sentence.trim().split(/\s+/).filter(Boolean)
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
  const sentences = text.match(SENTENCE_PATTERN)?.map(sentence => sentence.trim()).filter(Boolean) ?? []
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
