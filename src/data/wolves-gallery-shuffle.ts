export function shuffleWolvesGalleryPhotos<T>(photos: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...photos]

  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}
