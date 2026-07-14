import { chromium } from 'playwright'

const baseUrl = process.env.WOLVES_BASE_URL ?? 'http://127.0.0.1:5173'

async function verifyMobileLoreLayout() {
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 1000 } })

    await page.goto(`${baseUrl}/wolves/`, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.getByRole('button', { name: /join the evolution/i }).click()
    await page.waitForTimeout(1_000)

    const bounds = await page.evaluate(() => {
      const column = document.querySelector('.wolves-lore-column')
      const region = document.querySelector('.immersive-col-right')
      if (!column || !region) {
        throw new Error('Expected immersive lore column and region')
      }

      return {
        columnBottom: column.getBoundingClientRect().bottom,
        regionBottom: region.getBoundingClientRect().bottom,
      }
    })

    if (bounds.columnBottom > bounds.regionBottom) {
      throw new Error(`Lore column is clipped: ${JSON.stringify(bounds)}`)
    }
  }
  finally {
    await browser.close()
  }
}

verifyMobileLoreLayout().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
