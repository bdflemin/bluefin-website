import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MODULE_PATH = import.meta.url.startsWith('file:')
  ? fileURLToPath(import.meta.url)
  : null
const ROOT_DIR = MODULE_PATH ? dirname(dirname(MODULE_PATH)) : process.cwd()
const TARGET_PATH = join(ROOT_DIR, 'public', 'flickr-photos.json')

async function main() {
  const url = 'https://www.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=af8e5133eba9983c235490e3799abe1f&user_id=143247548@N03&per_page=500&format=json&nojsoncallback=1'

  try {
    console.info('Fetching photos from CNCF Flickr account...')
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Flickr HTTP error: ${res.status}`)
    }
    const data = await res.json()
    if (data.stat !== 'ok' || !data.photos || !Array.isArray(data.photos.photo)) {
      throw new Error(`Flickr API error: ${data.message || 'invalid response'}`)
    }

    const photos = data.photos.photo.map(p => ({
      id: p.id,
      server: p.server,
      secret: p.secret,
      title: p.title,
    }))

    await writeFile(TARGET_PATH, `${JSON.stringify(photos, null, 2)}\n`)
    console.info(`Successfully harvested ${photos.length} photos and saved to public/flickr-photos.json`)
  }
  catch (error) {
    console.error('Error updating Flickr photos:', error)
    try {
      await readFile(TARGET_PATH, 'utf8')
      console.info('Preserving previous cache state of public/flickr-photos.json')
    }
    catch {
      console.info('No previous cache found. Writing empty array to avoid breaking client-side.')
      await writeFile(TARGET_PATH, '[]\n')
    }
  }
}

main()
