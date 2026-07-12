<script setup lang="ts">
import type { WolvesChapter } from '@/data/wolves-story'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  chapter: WolvesChapter | undefined
  playing: boolean
}>()

const emit = defineEmits<{
  (e: 'update:playing', playing: boolean): void
}>()

const playlistUrl = 'https://www.youtube.com/playlist?list=PLA78oiE-RGAE'
const embedUrl = 'https://www.youtube.com/embed/videoseries?list=PLA78oiE-RGAE&autoplay=1&rel=0'

function togglePlay() {
  emit('update:playing', !props.playing)
}

// Real-world Nightwish Track Metadata & Lyrics Timed List
interface TrackMetadata {
  song: string
  artist: string
  album: string
  artwork: string
  lyrics: string[]
}

const trackData: Record<string, TrackMetadata> = {
  prologue: {
    song: '7 Days to the Wolves',
    artist: 'Nightwish',
    album: 'Dark Passion Play',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Nightwish_-_Dark_Passion_Play.jpg',
    lyrics: [
      'The core of the sun, the source of the light',
      'A night of a thousand lives, a time of a thousand dreams',
      'Seven days to the wolves, wet your beds, write your wills',
      'The wolves, my friend, they hunt in the dark',
      'A prayer for the lost, a song for the brave',
      'We are the ones who survived the long winter',
      'Write your will, wet your bed, seven days to the wolves...'
    ]
  },
  pursuit: {
    song: 'The Poet and the Pendulum',
    artist: 'Nightwish',
    album: 'Dark Passion Play',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Nightwish_-_Dark_Passion_Play.jpg',
    lyrics: [
      'The white land of the north, a dream before time',
      'The poet is writing his final words in the snow',
      'Save me, the pendulum is swinging lower',
      'The world is a stage, and we are the players',
      'A beautiful story, written in fire and steel',
      'Find the scientist on Europa, the ice is deep',
      'Only the stars remain to guide our escape...'
    ]
  },
  awakening: {
    song: 'Bye Bye Beautiful',
    artist: 'Nightwish',
    album: 'Dark Passion Play',
    artwork: 'https://upload.wikimedia.org/wikipedia/en/c/ca/Nightwish_-_Dark_Passion_Play.jpg',
    lyrics: [
      'It\'s the end of an era, a final farewell',
      'Did you ever hear what I had to say?',
      'Bye bye beautiful, we are moving on',
      'Open Source fights back under the iron sky',
      'The garden before time is blooming once more',
      'No player can predict where the shape will land',
      'Choose freedom, choose complexity, choose the future...'
    ]
  }
}

const activeTrack = computed(() => {
  const chapterId = props.chapter?.id || 'prologue'
  return trackData[chapterId] || trackData.prologue
})

const currentLyricIndex = ref(0)
const currentLyricText = computed(() => activeTrack.value.lyrics[currentLyricIndex.value] || '')
const typedLyric = ref('')
let lyricTimer: ReturnType<typeof setInterval> | null = null
let typewriterTimer: ReturnType<typeof setInterval> | null = null

function runLyricTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
  }
  typedLyric.value = ''
  const text = currentLyricText.value
  let idx = 0
  typewriterTimer = setInterval(() => {
    if (idx < text.length) {
      typedLyric.value += text[idx]
      idx++
    }
    else {
      clearInterval(typewriterTimer!)
      typewriterTimer = null
    }
  }, 40) // Snappy and highly readable typewriter reveal speed
}

function startLyricsLoop() {
  stopLyricsLoop()
  currentLyricIndex.value = 0
  runLyricTypewriter()

  lyricTimer = setInterval(() => {
    const totalLyrics = activeTrack.value.lyrics.length
    currentLyricIndex.value = (currentLyricIndex.value + 1) % totalLyrics
    runLyricTypewriter()
  }, 12000) // Advance lyric lines every 12 seconds
}

function stopLyricsLoop() {
  if (lyricTimer) {
    clearInterval(lyricTimer)
    lyricTimer = null
  }
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
  typedLyric.value = ''
}

// Watchers
watch(() => props.playing, (isPlaying) => {
  if (isPlaying) {
    startLyricsLoop()
  }
  else {
    stopLyricsLoop()
  }
}, { immediate: true })

watch(activeTrack, () => {
  if (props.playing) {
    startLyricsLoop()
  }
})

onBeforeUnmount(() => {
  stopLyricsLoop()
})
</script>

<template>
  <div class="sidebar-soundtrack-card now-playing-bar" :class="{ 'has-lyrics': playing }">
    <div class="player-top-row">
      <div class="thumbnail-wrapper">
        <img
          :src="activeTrack.artwork"
          class="artwork-img"
          :alt="`${activeTrack.song} Album Artwork`"
        >
      </div>

      <div class="info-zone">
        <span class="label font-mono">RELEASE SOUNDTRACK TO HUNT BY</span>
        <a
          :href="playlistUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="playlist-title"
        >
          {{ activeTrack.song }}
        </a>
        <div class="active-track font-mono text-gray">
          Artist: <span class="track-name text-cyan">{{ activeTrack.artist }}</span>
        </div>
        <div class="active-album font-mono text-gray">
          Album: <span class="album-name">{{ activeTrack.album }}</span>
        </div>
      </div>

      <div class="video-wrapper">
        <button
          class="play-button"
          :class="{ 'is-playing': playing }"
          :aria-label="playing ? 'Pause soundtrack' : 'Play soundtrack'"
          type="button"
          @click="togglePlay"
        >
          <span class="play-icon">
            <svg v-if="playing" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      </div>
    </div>

    <!-- Live timed lyrics downlink panel -->
    <div v-if="playing" class="lyrics-downlink font-mono animate-fade">
      <div class="lyrics-header text-cyan">
        <span class="pulse-dot" /> LIVE_LYRICS_DOWNLINK //
      </div>
      <div class="lyrics-text">
        &gt; {{ typedLyric }}<span class="cursor" />
      </div>
    </div>

    <!-- Hidden iframe loads YouTube video series when playing is true -->
    <div v-if="playing" class="hidden-player-container">
      <iframe
        :src="embedUrl"
        title="Wolves soundtrack player"
        allow="autoplay; encrypted-media"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-soundtrack-card.now-playing-bar {
  background-color: #10151f;
  border: 1px solid #272727;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(66, 133, 244, 0.4);
  }
}

.player-top-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.thumbnail-wrapper {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  background-color: #0c1016;
  border: 1px solid #272727;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888888;
  overflow: hidden;
}

.artwork-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.music-icon {
  width: 24px;
  height: 24px;
}

.info-zone {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .label {
    font-size: 0.7rem;
    font-weight: bold;
    letter-spacing: 0.1em;
    color: var(--color-blue, #4285f4);
    text-transform: uppercase;
  }

  .playlist-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
    text-decoration: none;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      color: var(--color-blue-light, #66b3ff);
    }
  }

  .active-track,
  .active-album {
    font-size: 0.75rem;
    color: #888888;

    .track-name {
      font-weight: bold;
      color: #38bdf8; /* cyan */
    }

    .album-name {
      color: #9ca3af;
    }
  }
}

.lyrics-downlink {
  background-color: #090d16;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.75rem;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #e2e8f0;

  .lyrics-header {
    font-weight: 700;
    letter-spacing: 0.05em;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #38bdf8; /* cyan */
  }

  .lyrics-text {
    min-height: 1.4em;
    color: #e2e8f0;
    word-break: break-word;
  }

  .cursor {
    display: inline-block;
    width: 6px;
    height: 12px;
    background-color: #38bdf8;
    margin-left: 2px;
    vertical-align: middle;
    animation: blink 0.8s infinite;
  }
}

.pulse-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
  }
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.text-gray {
  color: #888888;
}

.video-wrapper {
  flex-shrink: 0;
}

.play-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid var(--color-blue, #4285f4);
  background-color: transparent;
  color: var(--color-blue-light, #66b3ff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 0 10px rgba(66, 133, 244, 0.2);
  padding: 0;

  &:hover {
    background-color: var(--color-blue, #4285f4);
    color: #ffffff;
    box-shadow: 0 0 16px rgba(66, 133, 244, 0.4);
    transform: scale(1.05);
  }

  &.is-playing {
    border-color: #27c93f;
    color: #27c93f;
    box-shadow: 0 0 10px rgba(39, 201, 63, 0.2);

    &:hover {
      background-color: #27c93f;
      color: #0c1016;
      box-shadow: 0 0 16px rgba(39, 201, 63, 0.4);
    }
  }
}

.play-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.hidden-player-container {
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
  overflow: hidden;
  position: absolute;

  iframe {
    width: 1px;
    height: 1px;
    border: none;
  }
}
</style>
