export interface WolvesGalleryPhoto {
  id: string
  title: string
}

export function getWolvesGalleryEventKey(photo: WolvesGalleryPhoto): string {
  const eventKey = photo.title.split('_').slice(0, 3).filter(Boolean).join('_')
  return eventKey || photo.id
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

export function buildWolvesGalleryCycle<T extends WolvesGalleryPhoto>(
  photos: readonly T[],
  random: () => number = Math.random,
): T[] {
  const eventGroups = new Map<string, T[]>()

  for (const photo of photos) {
    const eventKey = getWolvesGalleryEventKey(photo)
    eventGroups.set(eventKey, [...(eventGroups.get(eventKey) ?? []), photo])
  }

  const buckets = [...eventGroups.values()].map(group => shuffle(group, random))
  const cycle: T[] = []

  while (buckets.some(bucket => bucket.length > 0)) {
    for (const bucket of buckets) {
      const photo = bucket.shift()
      if (photo) {
        cycle.push(photo)
      }
    }
  }

  return cycle
}
