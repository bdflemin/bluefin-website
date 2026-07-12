<!--
README: Bluefin Wolves Teaser Landing Page Component
===================================================
- Page Path: projectbluefin.io/wolves
- Comic Content: Renders the real "Color with Bluefin" coloring book PDF
  (https://download.projectbluefin.io/color-with-bluefin.pdf) page-by-page onto
  an HTML5 canvas using PDF.js, loaded dynamically from the cdnjs CDN (see
  `PDFJS_SCRIPT_URL` / `PDFJS_WORKER_URL` below). To point at a different PDF,
  update `PDF_URL`.
- Intercepted Communications: Sourced from `src/data/intercepted-communications.json`.
  Add conversations there with title, channel, date, and ordered messages.
- Donate QR Code: Pointing to `https://docs.projectbluefin.io/donations`.
  To change the donation target URL, update `scripts/generate-qrs.js` and re-run.
- Playlist ID in use: `PLA78oiE-RGAE` ("Bluefin: Seven Days to the Wolves" on YouTube).
-->
<script setup lang="ts">
import type { WolvesChapter } from './data/wolves-story'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import qrDonate from '@/assets/svg/qr-donate.svg'
import qrStore from '@/assets/svg/qr-store.svg'
import TopNavbar from './components/TopNavbar.vue'
import WolvesSoundtrack from './components/wolves/WolvesSoundtrack.vue'
import bazziteQuotes from './data/bazzite-quotes.json'
import interceptedCommunications from './data/intercepted-communications.json'
import { shuffleLoreEntries } from './utils/loreRotation'
import { getChapterForPage } from './utils/wolvesStory'

interface QuoteEntry {
  quote: string
  person: string
  sourceType: string
  sourceTitle: string
  sourceDetail?: string
  date: string
}

interface InterceptedMessage {
  speaker: string
  text: string
  timestamp?: string
}

interface InterceptedConversation {
  title: string
  channel: string
  date: string
  sourceTitle?: string
  sourceCollection?: string
  sourceUrl?: string
  attribution?: string
  messages: InterceptedMessage[]
}

const conversations = interceptedCommunications as InterceptedConversation[]
const quotes = bazziteQuotes as QuoteEntry[]

type LoreEntry
  = { type: 'quote', data: QuoteEntry }
    | { type: 'conversation', data: InterceptedConversation }

const loreEntries = shuffleLoreEntries([
  ...quotes.map(data => ({ type: 'quote' as const, data })),
  ...conversations.map(data => ({ type: 'conversation' as const, data })),
])

// PDF.js is injected dynamically from CDNJS (see loadPdfJs()) and attaches itself
// to `window.pdfjsLib`. It ships no first-party types, so we treat it as `any`.
const PDF_URL = `${import.meta.env.BASE_URL}color-with-bluefin.pdf`
const PDFJS_SCRIPT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
const PDFJS_SCRIPT_INTEGRITY = 'sha512-q+4liFwdPC/bNdhUpZx6aXDx/h77yEQtn4I1slHydcbZK34nLaR3cAeYSJshoxIOq3mjEf7xJE8YWIUHMn+oCQ=='
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

let pdfjsLib: any = null
let pdfDocument: any = null
// Tracks in-flight render tasks per canvas element so a resize/page-flip can cancel
// a stale render before starting a new one on the same canvas.
const renderTasks = new Map<HTMLCanvasElement, any>()

// Comic Reader state
const totalPages = ref(0)
const currentPageIndex = ref(0) // 0-based for the UI; PDF.js pages are 1-based
const readingMode = ref<'flip' | 'scroll'>('scroll') // 'flip' = page-by-page, 'scroll' = stacked vertical
const pdfLoading = ref(true)
const pdfError = ref('')

// Soundtrack / entry state (component-owned detail lives in WolvesSoundtrack)
const hasEntered = ref(false)
const activeChapter = computed<WolvesChapter | undefined>(() => getChapterForPage(currentPageIndex.value + 1))

// Template refs: the "flip" mode uses a single canvas, the "scroll" mode renders
// one canvas per page into an array indexed by page number.
const flipViewport = ref<HTMLElement | null>(null)
const flipCanvas = ref<HTMLCanvasElement | null>(null)
const scrollContainer = ref<HTMLElement | null>(null)
const scrollCanvases = ref<(HTMLCanvasElement | null)[]>([])

let flipResizeObserver: ResizeObserver | null = null
let scrollResizeObserver: ResizeObserver | null = null

function setScrollCanvasRef(el: Element | null, index: number) {
  scrollCanvases.value[index] = el as HTMLCanvasElement | null
}

// Dynamically injects a <script> tag once and resolves when it has loaded.
// When `integrity` is supplied, the script is fetched with subresource integrity
// verification and CORS mode enabled so the browser can check the hash.
function loadScript(src: string, integrity?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    if (integrity) {
      script.integrity = integrity
      script.crossOrigin = 'anonymous'
    }
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

// Injects PDF.js from CDNJS and wires up its worker script, caching the global for reuse.
async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) {
    return pdfjsLib
  }
  await loadScript(PDFJS_SCRIPT_URL, PDFJS_SCRIPT_INTEGRITY)
  const lib = (window as any).pdfjsLib
  if (!lib) {
    throw new Error('PDF.js failed to initialize')
  }
  lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL
  pdfjsLib = lib
  return lib
}

// Renders a single PDF page onto the given canvas, scaled to fill containerWidth.
async function renderPageOnCanvas(pageNumber: number, canvas: HTMLCanvasElement, containerWidth: number) {
  if (!pdfDocument || containerWidth <= 0) {
    return
  }

  // Cancel a stale in-flight render targeting this canvas before starting a new one.
  const existingTask = renderTasks.get(canvas)
  if (existingTask) {
    existingTask.cancel()
  }

  const page = await pdfDocument.getPage(pageNumber)
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = containerWidth / baseViewport.width
  const viewport = page.getViewport({ scale })

  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  // Render at native device pixel ratio for crisp output on HiDPI screens.
  const outputScale = window.devicePixelRatio || 1
  canvas.width = Math.floor(viewport.width * outputScale)
  canvas.height = Math.floor(viewport.height * outputScale)
  canvas.style.width = `${Math.floor(viewport.width)}px`
  canvas.style.height = `${Math.floor(viewport.height)}px`
  const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

  const renderTask = page.render({ canvasContext: context, viewport, transform })
  renderTasks.set(canvas, renderTask)
  renderTask.promise.then(() => {
    if (renderTasks.get(canvas) === renderTask) {
      renderTasks.delete(canvas)
    }
  }).catch(() => {})
  try {
    await renderTask.promise
  }
  catch (err: any) {
    if (err?.name !== 'RenderingCancelledException') {
      console.error('[wolves] Failed to render PDF page', pageNumber, err)
    }
  }
}

function getContentWidth(element: HTMLElement): number {
  const styles = window.getComputedStyle(element)
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0
  return Math.max(0, element.clientWidth - paddingLeft - paddingRight)
}

function renderFlipPage() {
  if (!flipCanvas.value) {
    return
  }
  const host = flipCanvas.value.parentElement as HTMLElement | null
  const width = host ? getContentWidth(host) : flipViewport.value?.clientWidth ?? 0
  renderPageOnCanvas(currentPageIndex.value + 1, flipCanvas.value, width)
}

function renderAllScrollPages() {
  if (!scrollContainer.value) {
    return
  }
  for (let i = 0; i < totalPages.value; i++) {
    const canvas = scrollCanvases.value[i]
    if (canvas) {
      const host = canvas.parentElement as HTMLElement | null
      const width = host ? getContentWidth(host) : scrollContainer.value.clientWidth
      renderPageOnCanvas(i + 1, canvas, width)
    }
  }
}

function setupFlipResizeObserver() {
  flipResizeObserver?.disconnect()
  if (!flipViewport.value) {
    return
  }
  flipResizeObserver = new ResizeObserver(() => renderFlipPage())
  flipResizeObserver.observe(flipViewport.value)
}

function setupScrollResizeObserver() {
  scrollResizeObserver?.disconnect()
  if (!scrollContainer.value) {
    return
  }
  scrollResizeObserver = new ResizeObserver(() => renderAllScrollPages())
  scrollResizeObserver.observe(scrollContainer.value)
}

async function loadComicPdf() {
  pdfLoading.value = true
  pdfError.value = ''
  try {
    const lib = await loadPdfJs()
    pdfDocument = await lib.getDocument(PDF_URL).promise
    totalPages.value = pdfDocument.numPages
    pdfLoading.value = false
    await nextTick()
    if (readingMode.value === 'flip') {
      setupFlipResizeObserver()
      renderFlipPage()
    }
    else {
      setupScrollResizeObserver()
      renderAllScrollPages()
    }
  }
  catch (err) {
    console.error('[wolves] Failed to load comic PDF', err)
    pdfError.value = 'Unable to load the comic book right now. Please try again in a moment.'
    pdfLoading.value = false
  }
}

// Keyboard navigation helper
function handleKeyDown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (target && (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)) {
    return
  }

  if (event.key === 'ArrowRight' || event.key === 'Right') {
    if (readingMode.value === 'flip') {
      nextPage()
    }
    else {
      loreNext()
    }
  }
  else if (event.key === 'ArrowLeft' || event.key === 'Left') {
    if (readingMode.value === 'flip') {
      prevPage()
    }
    else {
      lorePrev()
    }
  }
}

function nextPage() {
  if (currentPageIndex.value < totalPages.value - 1) {
    currentPageIndex.value++
  }
}

function prevPage() {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
  }
}

function jumpToPage(index: number) {
  if (index >= 0 && index < totalPages.value) {
    currentPageIndex.value = index
  }
}

// Re-render the current page whenever it changes in flip mode.
watch(currentPageIndex, () => {
  if (readingMode.value === 'flip' && !pdfLoading.value) {
    renderFlipPage()
  }
})

// Swap resize observers and (re)render pages whenever the layout mode toggles.
watch(readingMode, async (mode) => {
  if (pdfLoading.value || pdfError.value) {
    return
  }
  await nextTick()
  if (mode === 'flip') {
    scrollResizeObserver?.disconnect()
    setupFlipResizeObserver()
    renderFlipPage()
  }
  else {
    flipResizeObserver?.disconnect()
    setupScrollResizeObserver()
    renderAllScrollPages()
  }
})

// Mixed lore cycling state. The source arrays are shuffled once per page load.
const currentLoreIndex = ref(0)
const currentLoreEntry = computed<LoreEntry | null>(() => loreEntries[currentLoreIndex.value] ?? null)
let loreTimer: ReturnType<typeof setInterval> | null = null

function stopLoreTimer() {
  if (loreTimer) {
    clearInterval(loreTimer)
    loreTimer = null
  }
}

function startLoreTimer() {
  if (loreEntries.length <= 1 || loreTimer) {
    return
  }
  loreTimer = setInterval(() => {
    currentLoreIndex.value = (currentLoreIndex.value + 1) % loreEntries.length
  }, 9000)
}

function restartLoreTimer() {
  stopLoreTimer()
  startLoreTimer()
}

function loreNext() {
  if (loreEntries.length <= 1) {
    return
  }
  currentLoreIndex.value = (currentLoreIndex.value + 1) % loreEntries.length
  restartLoreTimer()
}

function lorePrev() {
  if (loreEntries.length <= 1) {
    return
  }
  currentLoreIndex.value = (currentLoreIndex.value - 1 + loreEntries.length) % loreEntries.length
  restartLoreTimer()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  loadComicPdf()

  // Start mixed lore auto-cycling interval (9 seconds)
  startLoreTimer()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  flipResizeObserver?.disconnect()
  scrollResizeObserver?.disconnect()
  renderTasks.forEach(task => task.cancel())
  renderTasks.clear()
  pdfDocument?.destroy()

  // Clear mixed lore auto-cycling interval to prevent memory leaks
  stopLoreTimer()
})
</script>

<template>
  <div class="wolves-teaser-page">
    <!-- Top Global Navigation Bar -->
    <TopNavbar />

    <!-- Main Outer Container -->
    <div class="wolves-layout">
      <!-- SECTION 1: HERO SECTION -->
      <header class="wolves-hero">
        <div class="hero-text">
          <!-- Aggressive display typography with heavy scale -->
          <h1 class="hero-title">
            Seven Days to the <span class="accent">Wolves</span>
          </h1>
          <p class="hero-description">
            In the distant future, open source maintainers are not only sought after, they are hunted. Enslaved by the very machines they created, betrayed by the societies they swore to protect. They fight alone.

            <br><br>Our Childhood's End, is their beginning.

            <br><br>A fundraising effort to immortalize contributors in legend. Issue sponsorships available.
          </p>
          <div class="hero-footnote">
            Coming 2027
          </div>
        </div>

        <!-- Soundtrack entry gate: lets the visitor choose before the story begins -->
        <WolvesSoundtrack
          :chapter="activeChapter"
          @entered="hasEntered = true"
        />
      </header>

      <!-- Two-column desktop layout: Comic Reader on the left, a pinned
           Soundtrack Widget + Bazzite Dispatch sidebar on the right. Falls
           back to a single vertical stack below 1024px. -->
      <div class="content-grid">
        <div class="col-left">
          <!-- SECTION 2: COMIC READER -->
          <section id="comic-reader" class="comic-reader-section">
            <div class="comic-toolbar">
              <div class="mode-selectors">
                <button
                  :class="{ active: readingMode === 'flip' }"
                  @click="readingMode = 'flip'"
                >
                  Page By Page
                </button>
                <button
                  :class="{ active: readingMode === 'scroll' }"
                  @click="readingMode = 'scroll'"
                >
                  Continuous Scroll
                </button>
              </div>
            </div>

            <!-- Comic Reader Layout: Page by Page (Slideshow) -->
            <div v-if="readingMode === 'flip'" class="page-flip-comic-layout">
              <div ref="flipViewport" class="comic-viewport">
                <!-- Page Contents -->
                <div class="comic-content-area">
                  <div v-if="pdfLoading" class="comic-status-wrap">
                    <div class="spinner" />
                    <p>Loading comic pages&hellip;</p>
                  </div>
                  <div v-else-if="pdfError" class="comic-status-wrap is-error">
                    <p>{{ pdfError }}</p>
                    <button class="ctrl-btn" @click="loadComicPdf">
                      Retry
                    </button>
                  </div>
                  <canvas
                    v-show="!pdfLoading && !pdfError"
                    ref="flipCanvas"
                    class="pdf-page-canvas"
                    role="img"
                    :aria-label="`Comic page ${currentPageIndex + 1} of ${totalPages}`"
                  />
                </div>

                <!-- Left Navigation Button -->
                <button
                  v-show="!pdfLoading && !pdfError && currentPageIndex > 0"
                  class="nav-btn prev"
                  aria-label="Previous Page"
                  @click="prevPage"
                >
                  &larr;
                </button>

                <!-- Right Navigation Button -->
                <button
                  v-show="!pdfLoading && !pdfError && currentPageIndex < totalPages - 1"
                  class="nav-btn next"
                  aria-label="Next Page"
                  @click="nextPage"
                >
                  &rarr;
                </button>
              </div>

              <!-- Bottom Control Bar (Navigation Controls) -->
              <div class="reader-controls">
                <button
                  class="ctrl-btn"
                  :disabled="pdfLoading || !!pdfError || currentPageIndex === 0"
                  @click="prevPage"
                >
                  &larr; Previous
                </button>

                <!-- Keyboard helper -->
                <div class="kbd-hint">
                  Use &larr; &rarr; arrow keys to turn pages &middot; Page {{ currentPageIndex + 1 }} of {{ totalPages || '—' }}
                </div>

                <div class="jump-select-wrap">
                  <span>Jump to:</span>
                  <select
                    :value="currentPageIndex"
                    :disabled="pdfLoading || !!pdfError || !totalPages"
                    @change="jumpToPage(Number(($event.target as HTMLSelectElement).value))"
                  >
                    <option v-for="n in totalPages" :key="n" :value="n - 1">
                      Page {{ n }}
                    </option>
                  </select>
                </div>

                <button
                  class="ctrl-btn"
                  :disabled="pdfLoading || !!pdfError || currentPageIndex === totalPages - 1"
                  @click="nextPage"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

            <!-- Comic Reader Layout: Continuous Stacked Vertical Scroll -->
            <div v-else ref="scrollContainer" class="scroll-comic-layout">
              <template v-if="pdfLoading">
                <div class="comic-status-wrap">
                  <div class="spinner" />
                  <p>Loading comic pages&hellip;</p>
                </div>
              </template>
              <template v-else-if="pdfError">
                <div class="comic-status-wrap is-error">
                  <p>{{ pdfError }}</p>
                  <button class="ctrl-btn" @click="loadComicPdf">
                    Retry
                  </button>
                </div>
              </template>
              <template v-else>
                <div
                  v-for="n in totalPages"
                  :key="n"
                  class="scroll-page-card"
                >
                  <div class="comic-viewport">
                    <div class="comic-content-area">
                      <canvas
                        :ref="(el) => setScrollCanvasRef(el as Element | null, n - 1)"
                        class="pdf-page-canvas"
                        role="img"
                        :aria-label="`Page ${n} of ${totalPages}`"
                      />
                    </div>
                  </div>
                  <div class="comic-caption-bar">
                    Page {{ n }} of {{ totalPages }}
                  </div>
                </div>
              </template>
            </div>
          </section>
        </div>

        <div class="col-right">
          <!-- SECTION 3: INTERCEPTED COMMUNICATIONS -->
          <section id="intercepted-communications" class="comic-reader-section dispatch-quote-section">
            <div class="dispatch-quote-card">
              <div class="dispatch-plan-content">
                <p class="dispatch-plan-command">
                  nimbinatus@blue-universal:~$ monitor --archive
                </p>
                <h2 class="title-h2">
                  Recovered Transmissions
                </h2>
                <p class="title-p">
                  Signal: Captured
                  <br>Source: Quotes + Intercepts
                  <br>Rotation: Randomized on load
                </p>
              </div>

              <div class="quote-nav">
                <button
                  class="quote-nav-btn"
                  aria-label="Previous transmission"
                  @click="lorePrev"
                >
                  &larr;
                </button>
                <button
                  class="quote-nav-btn"
                  aria-label="Next transmission"
                  @click="loreNext"
                >
                  &rarr;
                </button>
              </div>

              <div class="quote-viewport">
                <Transition name="quote-fade">
                  <div
                    v-if="currentLoreEntry"
                    :key="currentLoreIndex"
                    class="conversation-rotator"
                  >
                    <div v-if="currentLoreEntry.type === 'conversation'" class="conversation-heading">
                      <span>{{ currentLoreEntry.data.channel }}</span>
                      <time :datetime="currentLoreEntry.data.date">{{ currentLoreEntry.data.date }}</time>
                    </div>
                    <h3 v-if="currentLoreEntry.type === 'conversation'" class="conversation-title">
                      {{ currentLoreEntry.data.title }}
                    </h3>
                    <ol v-if="currentLoreEntry.type === 'conversation'" class="conversation-messages">
                      <li
                        v-for="(message, index) in currentLoreEntry.data.messages"
                        :key="`${currentLoreIndex}-${index}`"
                        class="conversation-message"
                      >
                        <div class="conversation-message-header">
                          <span class="conversation-speaker">{{ message.speaker }}</span>
                          <time v-if="message.timestamp">{{ message.timestamp }}</time>
                        </div>
                        <p>{{ message.text }}</p>
                      </li>
                    </ol>
                    <div
                      v-if="currentLoreEntry.type === 'conversation' && currentLoreEntry.data.sourceTitle"
                      class="conversation-source"
                    >
                      <span>{{ currentLoreEntry.data.attribution ?? 'ARCHIVE REFERENCE' }}</span>
                      <a
                        v-if="currentLoreEntry.data.sourceUrl"
                        :href="currentLoreEntry.data.sourceUrl"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {{ currentLoreEntry.data.sourceCollection ?? 'SOURCE' }}:
                        {{ currentLoreEntry.data.sourceTitle }}
                      </a>
                      <span v-else>
                        {{ currentLoreEntry.data.sourceCollection ?? 'SOURCE' }}:
                        {{ currentLoreEntry.data.sourceTitle }}
                      </span>
                    </div>
                    <div v-else-if="currentLoreEntry.type === 'quote'" class="lore-quote">
                      <div class="lore-quote-mark">
                        &ldquo;
                      </div>
                      <p class="lore-quote-text">
                        {{ currentLoreEntry.data.quote }}
                      </p>
                      <div class="lore-quote-meta">
                        <strong>{{ currentLoreEntry.data.person }}</strong>
                        <span>
                          {{ currentLoreEntry.data.sourceType }}: {{ currentLoreEntry.data.sourceTitle }}
                          <template v-if="currentLoreEntry.data.sourceDetail">
                            — {{ currentLoreEntry.data.sourceDetail }}
                          </template>
                        </span>
                        <time :datetime="currentLoreEntry.data.date">{{ currentLoreEntry.data.date }}</time>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- SECTION 4: QR CODES SECTION (full-width, below the two-column grid) -->
      <section id="wolves-support" class="comic-reader-section">
        <div class="support-wrap">
          <h2 class="title-h2">
            Support the Mission
          </h2>
          <p class="title-p">
            Secure official gear or donate directly to fuel next-generation Linux workstation research, hardware enablement, and future comic releases.
          </p>
        </div>

        <div class="qr-grid">
          <!-- QR Card 1: Official Store -->
          <div class="qr-card">
            <h3 class="qr-title">
              Official Store
            </h3>
            <div class="qr-image-box">
              <img :src="qrStore" alt="QR Code linking to Store">
            </div>
            <div class="qr-action-wrap">
              <a
                href="https://store.projectbluefin.io"
                target="_blank"
                rel="noopener noreferrer"
                class="qr-btn blue"
              >
                Go to Store &rarr;
              </a>
              <span class="qr-domain">store.projectbluefin.io</span>
            </div>
          </div>

          <!-- QR Card 2: Donate to Project -->
          <div class="qr-card">
            <h3 class="qr-title">
              Donate to Bluefin
            </h3>
            <div class="qr-image-box">
              <img :src="qrDonate" alt="QR Code to Donate">
            </div>
            <div class="qr-action-wrap">
              <a
                href="https://docs.projectbluefin.io/donations"
                target="_blank"
                rel="noopener noreferrer"
                class="qr-btn dark"
              >
                Donate Now &rarr;
              </a>
              <span class="qr-domain">docs.projectbluefin.io/donations</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wolves-teaser-page {
  background-image: url('/evening/10-bluefin-night.webp');
  // Full-width crisp tiling (image is 6300x2700) instead of `cover`, which
  // would blur/stretch it to fill the viewport.
  background-size: 100% auto;
  background-position: top center;
  background-repeat: repeat-y;
  min-height: 100vh;
  position: relative;
  // Firefox can break sticky descendants when an ancestor creates a scrolling
  // container via overflow. `clip` prevents horizontal bleed without that side
  // effect.
  overflow-x: clip;
  box-sizing: border-box;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 600px;
    background: linear-gradient(to bottom, rgba(12, 16, 22, 0.7), transparent);
    z-index: 0;
    pointer-events: none;
  }
}

.wolves-layout {
  position: relative;
  z-index: 1;
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

// Two-column desktop grid: Comic Reader (left) + pinned Soundtrack Widget /
// Bazzite Dispatch sidebar (right). Falls back to a vertical stack below
// 1024px.
.content-grid {
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
    align-items: start;
    gap: 28px;
  }
}

.col-left {
  min-width: 0;

  // Left-align the comic reader within its column instead of the
  // page-wide auto-centering used when the reader is the sole column.
  .comic-viewport,
  .scroll-comic-layout,
  .reader-controls {
    margin-left: 0;
    margin-right: 0;
    max-width: 100%;
  }
}

.col-right {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 40px;

  @media (min-width: 1024px) {
    position: sticky;
    top: auto;
    bottom: 24px;
    align-self: end;
    height: max-content;
  }
}

// Persistent Floating Soundtrack Widget (markup moved to WolvesSoundtrack component)
// Mobile: reserve space at the bottom of the page for the fixed player bar,
// but only while the bar is actually visible (class toggled by WolvesSoundtrack).
:global(.wolves-player-active) .wolves-layout {
  @media (max-width: 767px) {
    padding-bottom: calc(88px + env(safe-area-inset-bottom));
  }
}

// Hero Section
.wolves-hero {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 0 20px;
  border-bottom: 1px solid rgba(var(--color-blue-rgb), 0.2);

  .hero-text {
    text-align: center;

    @media (min-width: 768px) {
      text-align: left;
    }
  }

  .hero-title {
    font-size: clamp(2.8rem, 4.8vw, 4.2rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    text-transform: uppercase;
    margin-bottom: 12px;

    @media (min-width: 768px) {
      font-size: clamp(3.8rem, 5.8vw, 5.2rem);
    }

    .accent {
      color: var(--color-blue);
    }
  }

  .hero-description {
    font-size: 1.3rem;
    line-height: 1.6;
    color: #bdbdbd;
    margin-bottom: 12px;
    max-width: 600px;
  }

  .hero-footnote {
    font-size: 1rem;
    color: rgba(189, 189, 189, 0.6);
    font-style: italic;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

// Comic Reader Section
.comic-toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .comic-hint {
    margin: 0;
    font-size: 1.1rem;
    color: rgba(189, 189, 189, 0.8);
    text-align: center;
  }
}

.mode-selectors {
  display: flex;
  background-color: #10151f;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #272727;
  align-self: flex-start;

  button {
    background: none;
    border: none;
    color: #bdbdbd;
    font-size: 1.2rem;
    font-weight: 700;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background-color: var(--color-blue);
      color: #ffffff;
    }

    &:hover:not(.active) {
      color: #ffffff;
    }
  }
}

// Comic Page Viewer
.comic-viewport {
  position: relative;
  width: 100%;
  min-height: 220px;
  max-width: 760px;
  max-height: min(74dvh, 760px);
  margin: 0 auto;
  background-color: #10151f;
  border: 1px solid rgba(var(--color-blue-rgb), 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;

  .comic-content-area {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 220px;
    padding: 12px;
    overflow: hidden;
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.7);
    border: 1px solid #272727;
    color: #ffffff;
    font-size: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;

    &:hover {
      background-color: #000;
      color: var(--color-blue-light);
      border-color: var(--color-blue-light);
    }

    &.prev {
      left: 12px;
    }
    &.next {
      right: 12px;
    }
  }
}

// Canvas the current PDF page is rendered onto; JS sets explicit pixel
// dimensions to match the container width at the device pixel ratio.
.pdf-page-canvas {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
}

// Loading / error states shown while PDF.js fetches and parses the PDF
.comic-status-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 32px;
  text-align: center;
  color: #bdbdbd;
  font-size: 1.4rem;

  &.is-error {
    color: var(--color-blue-light);
  }

  .spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid rgba(var(--color-blue-rgb), 0.25);
    border-top-color: var(--color-blue);
    animation: comic-spinner-spin 0.8s linear infinite;
  }
}

@keyframes comic-spinner-spin {
  to {
    transform: rotate(360deg);
  }
}

.comic-caption-bar {
  background-color: rgba(0, 0, 0, 0.9);
  padding: 16px 24px;
  border-top: 1px solid #272727;
  text-align: center;
  font-size: 1.3rem;
  color: #ffffff;
  font-weight: 500;
  line-height: 1.5;
}

.reader-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 0;
  gap: 8px 12px;
  flex-wrap: wrap;

  .ctrl-btn {
    background-color: #10151f;
    border: 1px solid #272727;
    color: #bdbdbd;
    font-size: 1.2rem;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      color: #ffffff;
      border-color: var(--color-blue-light);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .kbd-hint {
    font-size: 1.1rem;
    color: #616161;
  }

  .jump-select-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.2rem;
    color: #bdbdbd;

    select {
      background-color: #10151f;
      border: 1px solid #272727;
      color: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 1.2rem;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: var(--color-blue-light);
      }
    }
  }
}

// Continuous Scroll Layout
.scroll-comic-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;

  .comic-viewport {
    max-height: none;
  }

  .comic-content-area {
    overflow: visible;
  }

  .scroll-page-card {
    background-color: #10151f;
    border: 1px solid rgba(var(--color-blue-rgb), 0.2);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  }
}

// Intercepted communications section
.dispatch-quote-card {
  background-color: #10151f;
  border: 1px solid #272727;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;

  &:hover {
    border-color: rgba(var(--color-blue-rgb), 0.4);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
}

.dispatch-plan-content {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  background: linear-gradient(180deg, rgba(16, 21, 31, 0.98) 0%, rgba(12, 16, 22, 0.98) 100%);
  border: 1px solid rgba(var(--color-blue-rgb), 0.22);
  border-radius: 10px;
  padding: 12px 96px 12px 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.dispatch-plan-command {
  margin: 0 0 6px;
  font-size: 0.86rem;
  color: rgba(189, 189, 189, 0.65);
}

.dispatch-plan-content .title-h2 {
  margin: 0;
  font-size: 1.2rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #ffffff;
}

.dispatch-plan-content .title-p {
  margin: 6px 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgba(189, 189, 189, 0.9);
}

.quote-viewport {
  position: relative;
}

.conversation-rotator {
  position: relative;
  min-height: 220px;
  padding-top: 4px;
}

.conversation-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid rgba(var(--color-blue-rgb), 0.25);
  padding-bottom: 8px;
  color: var(--color-blue-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}

.conversation-title {
  margin: 16px 0 20px;
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 1.35rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.conversation-messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.conversation-message {
  border-left: 2px solid rgba(var(--color-blue-rgb), 0.45);
  padding-left: 16px;
}

.conversation-message-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-blue);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
}

.conversation-message-header time {
  color: rgba(189, 189, 189, 0.65);
}

.conversation-message p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 1.15rem;
  line-height: 1.65;
}

.conversation-source {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-top: 1px solid rgba(var(--color-blue-rgb), 0.25);
  margin-top: 20px;
  padding-top: 12px;
  color: rgba(189, 189, 189, 0.62);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.78rem;
  line-height: 1.45;
}

.conversation-source a {
  color: var(--color-blue);
  text-decoration: underline;
  text-decoration-color: rgba(var(--color-blue-rgb), 0.4);
  text-underline-offset: 3px;
}

.conversation-source a:hover {
  color: var(--color-blue-light);
}

.lore-quote {
  min-height: 220px;
  padding: 8px 0 0;
}

.lore-quote-mark {
  color: rgba(var(--color-blue-rgb), 0.28);
  font-family: Georgia, serif;
  font-size: 5rem;
  line-height: 0.6;
  pointer-events: none;
  user-select: none;
}

.lore-quote-text {
  margin: 18px 0 24px;
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1.65;
}

.lore-quote-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-top: 1px solid rgba(var(--color-blue-rgb), 0.25);
  padding-top: 14px;
  color: rgba(189, 189, 189, 0.78);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.95rem;
  line-height: 1.45;
}

.lore-quote-meta strong {
  color: var(--color-blue);
  font-size: 1rem;
}

.lore-quote-meta time {
  color: rgba(189, 189, 189, 0.6);
}

.quote-nav {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  z-index: 3;
}

.quote-nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(var(--color-blue-rgb), 0.45);
  background-color: #10151f;
  color: var(--color-blue-light);
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(var(--color-blue-rgb), 0.15);
    border-color: var(--color-blue-light);
    color: #ffffff;
  }
}

/* Communication transition effects */
.quote-fade-enter-active,
.quote-fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.quote-fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.quote-fade-enter-from,
.quote-fade-leave-to {
  opacity: 0;
}

// Support / QR Section
.support-wrap {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qr-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 640px;
  margin: 24px auto 0;
  width: 100%;

  @media (min-width: 600px) {
    flex-direction: row;
  }
}

.qr-card {
  flex: 1;
  background-color: #10151f;
  border: 1px solid #272727;
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

  .qr-title {
    font-size: 1.4rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #ffffff;
    margin: 0;
  }

  .qr-image-box {
    width: 192px;
    height: 192px;
    background-color: #0c1016;
    border: 1px solid #272727;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .qr-action-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    align-items: center;
  }

  .qr-btn {
    display: inline-block;
    color: #ffffff;
    font-weight: 700;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 8px 24px;
    border-radius: 20px;
    text-decoration: none;
    transition: background-color 0.2s;

    &.blue {
      background-color: var(--color-blue);
      &:hover {
        background-color: var(--color-blue-light);
      }
    }

    &.dark {
      background-color: #272727;
      &:hover {
        background-color: #1e1e1e;
      }
    }
  }

  .qr-domain {
    font-size: 1.1rem;
    color: #616161;
  }
}
</style>
