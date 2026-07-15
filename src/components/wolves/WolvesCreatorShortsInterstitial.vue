<!--
  Creator Shorts interstitial: a fullscreen, one-time bridge inside the immersive theater between
  Track 0 ("7 Days to the Wolves") and Track 1 ("Ghosts In The Mist"). Plays through
  wolvesCreatorShorts once (alternating Lindsay Nikole / Cassidy Williams, Lindsay first, no
  looping) and emits `complete` when the last short ends so the parent can resume the soundtrack.
  Teleported to <body> per docs/skills/wolves-fullscreen-overlays.md — several immersive-layout
  ancestors use `transform`, which would otherwise confine a `position: fixed` overlay to its own
  widget instead of the real viewport.
-->
<script setup lang="ts">
import type { YoutubePlayer } from '@/composables/useYoutubeIframeApi'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { getYoutubePlayerConstructor, getYoutubePlayerState, loadYoutubeIframeApi } from '@/composables/useYoutubeIframeApi'
import { wolvesCreatorShorts } from '@/data/wolves-creator-shorts'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const currentIndex = ref(0)
const currentShort = computed(() => wolvesCreatorShorts[currentIndex.value])
const mountHost = ref<HTMLDivElement | null>(null)

let player: YoutubePlayer | undefined
let loadToken = 0

function destroyPlayer() {
  player?.destroy?.()
  player = undefined
}

function advance() {
  if (currentIndex.value >= wolvesCreatorShorts.length - 1) {
    destroyPlayer()
    emit('complete')
    return
  }
  currentIndex.value += 1
}

async function loadCurrentShort() {
  const token = ++loadToken
  destroyPlayer()

  const short = currentShort.value

  try {
    await loadYoutubeIframeApi()
  }
  catch {
    advance()
    return
  }

  if (token !== loadToken || !mountHost.value) {
    return
  }

  mountHost.value.replaceChildren()
  const mountNode = document.createElement('div')
  mountHost.value.appendChild(mountNode)

  const PlayerCtor = getYoutubePlayerConstructor()
  if (!PlayerCtor) {
    advance()
    return
  }

  player = new PlayerCtor(mountNode, {
    width: '100%',
    height: '100%',
    videoId: short.videoId,
    playerVars: {
      autoplay: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onStateChange: (event: { data: number }) => {
        if (event.data === getYoutubePlayerState().ENDED) {
          advance()
        }
      },
      onError: () => {
        // A missing/restricted short must never block the return to the live soundtrack.
        advance()
      },
    },
  })
}

watch(currentIndex, loadCurrentShort, { immediate: true })

onBeforeUnmount(() => {
  destroyPlayer()
})
</script>

<template>
  <Teleport to="body">
    <div class="wolves-creator-shorts-interstitial">
      <div ref="mountHost" class="wolves-creator-shorts-interstitial-player" />
      <p class="wolves-creator-shorts-interstitial-credit font-mono">
        Now playing: <a :href="currentShort.channelUrl" target="_blank" rel="noopener noreferrer">{{ currentShort.creatorName }}</a>
      </p>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.wolves-creator-shorts-interstitial {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #000;
  overflow: hidden;
}

.wolves-creator-shorts-interstitial-player {
  width: min(100%, 420px);
  height: min(100%, 745px);
  aspect-ratio: 9 / 16;
}

.wolves-creator-shorts-interstitial-credit {
  font-size: 1rem;
  color: #bdbdbd;

  a {
    color: var(--color-blue);
    text-decoration: underline;
  }
}
</style>
