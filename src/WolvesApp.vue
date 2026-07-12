<!--
README: Bluefin Wolves Teaser Landing Page Component
===================================================
- Page Path: projectbluefin.io/wolves
- Comic Content: Delegated to WolvesComicReader.vue. PDF URL is managed
  by the component itself (BASE_URL + color-with-bluefin.pdf).
- Intercepted Communications: Sourced from `src/data/intercepted-communications.json`.
  Add conversations there with title, channel, date, and ordered messages.
- Donate QR Code: Pointing to `https://docs.projectbluefin.io/donations`.
  To change the donation target URL, update `scripts/generate-qrs.js` and re-run.
- Playlist ID in use: `PLA78oiE-RGAE` ("Bluefin: Seven Days to the Wolves" on YouTube).
-->
<script setup lang="ts">
import type { WolvesChapter } from './data/wolves-story'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import qrDonate from '@/assets/svg/qr-donate.svg'
import qrStore from '@/assets/svg/qr-store.svg'
import TopNavbar from './components/TopNavbar.vue'
import WolvesComicReader from './components/wolves/WolvesComicReader.vue'
import WolvesSoundtrack from './components/wolves/WolvesSoundtrack.vue'
import bazziteQuotes from './data/bazzite-quotes.json'
import interceptedCommunications from './data/intercepted-communications.json'
import { wolvesRelease } from './data/wolves-story'
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

// Soundtrack / entry state (component-owned detail lives in WolvesSoundtrack)
const hasEntered = ref(false)

// Current page (1-based) tracked here so the chapter can be passed to WolvesSoundtrack.
const currentPage = ref(1)
const activeChapter = computed<WolvesChapter | undefined>(() => getChapterForPage(currentPage.value))

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
  startLoreTimer()
})

onBeforeUnmount(() => {
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
          <WolvesComicReader
            :chapters="wolvesRelease.chapters"
            @update:page="currentPage = $event"
          />
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
  :deep(.comic-viewport),
  :deep(.scroll-comic-layout),
  :deep(.reader-controls) {
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
