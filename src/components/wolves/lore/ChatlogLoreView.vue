<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CHAT_COMPLETION_PAUSE_SECONDS } from '@/data/wolves-lore-timing'
import { getChatlogLore } from '../lore'
import { CHAT_PAGE_CHARACTERS, estimatePagesSeconds } from './lore-pages'
import LoreRecordHeader from './LoreRecordHeader.vue'
import { splitReadableBeats } from './readable-beats'

const props = defineProps<LoreViewProps>()
const emit = defineEmits<{
  started: []
  complete: []
}>()

const conversation = computed(() => getChatlogLore(props.record))
const activeBeatIndex = ref(0)
const typedBeatText = ref('')
const revealedClimaxSentence = ref('')
let typewriterTimer: ReturnType<typeof setInterval> | null = null

const CLIMAX_ARTIFACT_ID = 'lorem-pursuit-1'
const CLIMAX_SPEAKER = 'BUR//S'
const CLIMAX_HOLD_MS = 3000
const CLIMAX_FADE_MS = 1000

interface ChatlogBeat {
  messageIndex: number
  beatIndex: number
  isContinuation: boolean
  speaker?: string
  text: string
  timestamp?: string
  isSfx?: boolean
}

const chatlogBeats = computed<ChatlogBeat[]>(() =>
  conversation.value.messages.flatMap((message, messageIndex) =>
    splitReadableBeats(message.text, CHAT_PAGE_CHARACTERS).map((text, beatIndex) => ({
      ...message,
      text,
      messageIndex,
      beatIndex,
      isContinuation: beatIndex > 0,
    })),
  ),
)
const activeBeat = computed(() => chatlogBeats.value[activeBeatIndex.value] ?? null)
const climaxMessageIndex = computed(() => props.record.id === CLIMAX_ARTIFACT_ID
  ? conversation.value.messages.findIndex(message => message.speaker === CLIMAX_SPEAKER)
  : -1)
const headerSpec = computed(() => [
  ...conversation.value.channel ? [{ key: 'channel', value: conversation.value.channel }] : [],
  ...conversation.value.date ? [{ key: 'date', value: conversation.value.date }] : [],
])

function clearTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
}

function runTypewriter() {
  clearTypewriter()
  emit('started')

  activeBeatIndex.value = 0
  typedBeatText.value = ''
  revealedClimaxSentence.value = ''

  let stepTime = 35
  {
    const usesLockedPlaybackBudget = props.record.id === CLIMAX_ARTIFACT_ID
    // Chat pages cost the same as every other lore page, plus the hold after
    // the final line.
    const minimumReadSeconds = estimatePagesSeconds(chatlogBeats.value.map(beat => beat.text))
      + CHAT_COMPLETION_PAUSE_SECONDS
    // A locked conversation owns its authored window: it spends exactly the
    // player-clock duration so the final sentence lands on the music.
    const readableBudgetMs = usesLockedPlaybackBudget
      ? (props.duration > 1 ? props.duration * 1000 : minimumReadSeconds * 1000)
      : minimumReadSeconds * 1000 * 0.7
    const climaxCueDuration = props.record.id === CLIMAX_ARTIFACT_ID
      ? CLIMAX_HOLD_MS + CLIMAX_FADE_MS
      : 0
    const reservedCompletionDuration = usesLockedPlaybackBudget
      ? CHAT_COMPLETION_PAUSE_SECONDS * 1000
      : 0
    let totalTicks = 0
    chatlogBeats.value.forEach((beat, index) => {
      const isSlow = beat.speaker === 'BUR//S' || beat.speaker === 'SARAH'
      totalTicks += beat.text.length
      const text = beat.text
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        if (char === '.' || char === '?' || char === '!') {
          totalTicks += isSlow ? 40 : 12
        }
        else if (char === '…') {
          totalTicks += isSlow ? 30 : 15
        }
        else if (char === ',') {
          totalTicks += isSlow ? 15 : 5
        }
      }
      totalTicks += isSlow ? 50 : 20
      if (usesLockedPlaybackBudget && index < chatlogBeats.value.length - 1) {
        totalTicks += isSlow ? 50 : 20
      }
    })
    stepTime = Math.max(
      5,
      Math.min(50, Math.max(0, readableBudgetMs - climaxCueDuration - reservedCompletionDuration) / totalTicks),
    )
  }

  let currentLength = 0
  let pauseTicks = 0
  let completionPending = false
  let climaxStage: 'typing' | 'holding' | 'fading' = 'typing'

  typewriterTimer = setInterval(() => {
    if (pauseTicks > 0) {
      pauseTicks--
      return
    }

    if (completionPending) {
      emit('complete')
      clearTypewriter()
      return
    }

    const currentBeat = activeBeat.value
    if (!currentBeat) {
      clearTypewriter()
      return
    }

    const targetText = currentBeat.text
    const speaker = currentBeat.speaker
    const isSlowSpeaker = speaker === 'BUR//S' || speaker === 'SARAH'
    const isClimaxMessage = currentBeat.messageIndex === climaxMessageIndex.value
      && currentBeat.beatIndex === 0
    const climaxOpeningEnd = targetText.indexOf('. ') + 2

    if (isClimaxMessage && climaxStage === 'holding') {
      revealedClimaxSentence.value = targetText.slice(climaxOpeningEnd)
      climaxStage = 'fading'
      pauseTicks = Math.ceil(CLIMAX_FADE_MS / stepTime)
      return
    }

    if (isClimaxMessage && climaxStage === 'fading') {
      activeBeatIndex.value++
      typedBeatText.value = ''
      currentLength = 0
      return
    }

    currentLength++

    if (currentLength <= targetText.length) {
      typedBeatText.value = targetText.slice(0, currentLength)

      if (isClimaxMessage && currentLength === climaxOpeningEnd) {
        climaxStage = 'holding'
        pauseTicks = Math.ceil(CLIMAX_HOLD_MS / stepTime)
        return
      }

      const lastChar = targetText[currentLength - 1]
      if (isSlowSpeaker) {
        pauseTicks = 2
        if (lastChar === '.' || lastChar === '?' || lastChar === '!') {
          pauseTicks = 40
        }
        else if (lastChar === '…') {
          pauseTicks = 30
        }
        else if (lastChar === ',') {
          pauseTicks = 15
        }
      }
      else if (lastChar === '.' || lastChar === '?' || lastChar === '!') {
        pauseTicks = 12
      }
      else if (lastChar === '…') {
        pauseTicks = 15
      }
      else if (lastChar === ',') {
        pauseTicks = 5
      }

      // The Golden Era conversation's existing cadence is an authored anchor;
      // other chats must not accelerate just because their music slot is short.
      if (!isSlowSpeaker && props.record.id !== CLIMAX_ARTIFACT_ID) {
        pauseTicks = Math.max(pauseTicks, Math.ceil(35 / stepTime) - 1)
      }

      if (currentLength === targetText.length) {
        pauseTicks = Math.max(pauseTicks, isSlowSpeaker ? 50 : 20)
      }
    }
    else {
      typedBeatText.value = targetText
      if (activeBeatIndex.value === chatlogBeats.value.length - 1) {
        completionPending = true
        pauseTicks = Math.ceil(CHAT_COMPLETION_PAUSE_SECONDS * 1000 / stepTime)
      }
      else {
        activeBeatIndex.value++
        typedBeatText.value = ''
        currentLength = 0
        pauseTicks = isSlowSpeaker ? 50 : 20
      }
    }
  }, stepTime)
}

watch(() => props.record, () => {
  runTypewriter()
}, { immediate: true })

onBeforeUnmount(clearTypewriter)
</script>

<template>
  <section
    id="intercepted-communications"
    class="lore-dossier-panel"
    data-lore-view="chatlog"
    data-lore-view-kind="chatlog"
  >
    <LoreRecordHeader
      eyebrow="TRANSMISSION"
      :title="conversation.title"
      :spec="headerSpec"
    />

    <aside
      v-if="warning"
      class="lore-dossier-warning thesis-warning-fade"
      data-lore-warning
    >
      {{ warning }}
    </aside>

    <div class="quote-viewport">
      <Transition name="quote-fade">
        <ol :key="record.id" class="conversation-messages">
          <li
            v-if="activeBeat"
            :key="`${record.id}-${activeBeat.messageIndex}-${activeBeat.beatIndex}`"
            class="conversation-message"
            :class="{ 'sfx-message': activeBeat.isSfx }"
            :data-chatlog-beat-index="activeBeatIndex"
            :data-chatlog-message-index="activeBeat.messageIndex"
            :data-chatlog-beat-continuation="activeBeat.isContinuation"
          >
            <p v-if="activeBeat.isSfx" class="sfx-text">
              {{ typedBeatText }}
            </p>
            <template v-else>
              <div class="conversation-message-header">
                <span class="conversation-speaker">{{ activeBeat.speaker }}</span>
                <time v-if="activeBeat.timestamp">{{ activeBeat.timestamp }}</time>
              </div>
              <p v-if="typedBeatText || (activeBeat.messageIndex === climaxMessageIndex && revealedClimaxSentence)">
                {{ typedBeatText }}
                <Transition name="climax-fade">
                  <span
                    v-if="activeBeat.messageIndex === climaxMessageIndex && revealedClimaxSentence"
                    class="climax-sentence"
                  >{{ revealedClimaxSentence }}</span>
                </Transition>
              </p>
            </template>
          </li>
        </ol>
      </Transition>
    </div>
  </section>
</template>
