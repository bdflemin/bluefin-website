export function shuffleWolvesGalleryPhotos<T>(photos: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...photos]

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

export function shuffleWolvesGalleryPhotosWithSeed<T>(photos: readonly T[], seed: string): T[] {
  let state = 2166136261
  for (const character of seed) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619)
  }

  return shuffleWolvesGalleryPhotos(photos, () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  })
}
