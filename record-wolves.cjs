/* eslint-disable no-console */
const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright');

(async () => {
  const recordingsDir = path.join(__dirname, 'recordings')
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true })
  }

  console.log('Launching headless Chromium in 1440p viewport at 60fps...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 2560, height: 1440 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: recordingsDir,
      size: { width: 2560, height: 1440 }
    }
  })

  const page = await context.newPage()

  console.log('Navigating to http://localhost:5174/wolves/ ...')
  await page.goto('http://localhost:5174/wolves/')

  console.log('Page loaded. Injecting cinematic presentation CSS...')
  await page.addStyleTag({
    content: `
      .hud-exit-btn { display: none !important; }
      body, * { cursor: none !important; }
    `
  })

  const duration = 424 // track0 duration in seconds
  console.log(`Starting deterministic 60fps browser-side simulation for ${duration}s...`)

  // Run the browser-side simulation loop using requestAnimationFrame to ensure
  // every single frame is rendered smoothly and captured by Playwright at 60fps.
  await page.evaluate((dur) => {
    return new Promise((resolve) => {
      let currentTime = 0
      const fps = 60
      const frameDuration = 1 / fps

      function tick() {
        if (currentTime > dur) {
          resolve()
          return
        }

        if (typeof window.simulateWolvesProgress === 'function') {
          window.simulateWolvesProgress(currentTime, dur, 0)
        }

        currentTime += frameDuration
        requestAnimationFrame(tick)
      }

      requestAnimationFrame(tick)
    })
  }, duration)

  console.log('Simulation complete! Letting the outro fade settle for 2 seconds...')
  await page.waitForTimeout(2000)

  // Close context to finish writing the video
  console.log('Closing browser context to flush video to disk...')
  await context.close()
  await browser.close()

  // Find the video file
  const files = fs.readdirSync(recordingsDir)
  const webmFiles = files.filter(f => f.endsWith('.webm') && f !== 'wolves-first-song-1440p.webm')
  if (webmFiles.length === 0) {
    throw new Error('No recorded webm video file found in recordings/ directory')
  }

  // Sort by modification time to get the latest one
  webmFiles.sort((a, b) => {
    return fs.statSync(path.join(recordingsDir, b)).mtimeMs - fs.statSync(path.join(recordingsDir, a)).mtimeMs
  })

  const recordedWebmPath = path.join(recordingsDir, webmFiles[0])
  console.log(`Playwright recorded raw video to: ${recordedWebmPath}`)

  const audioPath = path.join(__dirname, 'track0.m4a')
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found at: ${audioPath}`)
  }

  const outputPath = '/var/home/jorge/Videos/wolves-first-song-1440p.mp4'
  console.log(`Merging and encoding video to standard MP4 with locked 60fps at 1440p into user's Videos folder: ${outputPath}...`)

  // Force locked 60fps encoding using highly optimized CPU VP9 (libvpx-vp9) with fast realtime parameters.
  // Using r=60 and forcing constant frame rate to remove stutters from browser frame drops.
  const ffmpegCmd = `ffmpeg -y -r 60 -i "${recordedWebmPath}" -i "${audioPath}" -c:v libvpx-vp9 -b:v 15M -deadline realtime -cpu-used 8 -threads 8 -tile-columns 2 -frame-parallel 1 -r 60 -c:a aac -b:a 320k "${outputPath}"`
  console.log(`Running FFmpeg: ${ffmpegCmd}`)
  execSync(ffmpegCmd, { stdio: 'inherit' })

  console.log('FFmpeg merge complete!')

  // Clean up the raw unmerged WebM and recordings folder
  fs.unlinkSync(recordedWebmPath)
  fs.rmSync(recordingsDir, { recursive: true, force: true })
  console.log('Cleaned up raw temporary files.')

  console.log('Wolves video generation system executed successfully!')
})().catch((err) => {
  console.error('Fatal Error:', err)
  process.exit(1)
})
