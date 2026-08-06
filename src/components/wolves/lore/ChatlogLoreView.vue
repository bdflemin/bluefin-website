<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CHAT_COMPLETION_PAUSE_SECONDS, estimateLoreReadDuration } from '@/data/wolves-lore-timing'
import { getChatlogLore } from '../lore'
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
const activePanel = ref<'chatlog' | string>('chatlog')
let typewriterTimer: ReturnType<typeof setInterval> | null = null

const CLIMAX_ARTIFACT_ID = 'lorem-pursuit-1'
const CLIMAX_SPEAKER = 'BUR//S'
const CLIMAX_HOLD_MS = 3000
const CLIMAX_FADE_MS = 1000
const CHATLOG_BEAT_MAXIMUM_CHARACTERS = 120

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
    splitReadableBeats(message.text, CHATLOG_BEAT_MAXIMUM_CHARACTERS).map((text, beatIndex) => ({
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
    const minimumReadSeconds = estimateLoreReadDuration({
      kind: 'chatlog',
      body: conversation.value.messages.map(message => message.text).join(' '),
      attribution: conversation.value.channel,
    })
    const readableBudgetMs = usesLockedPlaybackBudget
      ? Math.max(minimumReadSeconds * 1000, props.duration * 1000)
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

const activeProject = computed(() =>
  conversation.value.projects?.find(project => project.id === activePanel.value) ?? null,
)

watch(() => props.record, () => {
  activePanel.value = 'chatlog'
  runTypewriter()
}, { immediate: true })

onBeforeUnmount(clearTypewriter)
</script>

<template>
  <section
    id="intercepted-communications"
    class="dispatch-quote-section comic-reader-section"
    data-lore-view-kind="chatlog"
  >
    <div class="dispatch-quote-card">
      <div class="quote-viewport">
        <p v-if="warning" class="thesis-warning">
          {{ warning }}
        </p>
        <div
          v-if="conversation.projects?.length"
          class="conversation-project-tabs"
          data-chatlog-project-tabs
        >
          <button
            class="conversation-project-tab"
            :class="{ active: activePanel === 'chatlog' }"
            data-chatlog-project-tab="chatlog"
            @click.stop="activePanel = 'chatlog'"
          >
            [ CHATLOG ]
          </button>
          <button
            v-for="project in conversation.projects"
            :key="project.id"
            class="conversation-project-tab"
            :class="{ active: activePanel === project.id }"
            :data-chatlog-project-tab="project.id"
            @click.stop="activePanel = project.id"
          >
            [ {{ project.name.toUpperCase() }} ]
          </button>
        </div>
        <Transition name="quote-fade">
          <div v-if="activePanel === 'chatlog'" :key="record.id" class="conversation-rotator">
            <div class="conversation-heading">
              <span>{{ conversation.channel }}</span>
              <time :datetime="conversation.date">{{ conversation.date }}</time>
            </div>
            <h3 class="conversation-title">
              {{ conversation.title }}
            </h3>
            <ol class="conversation-messages">
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
          </div>
          <div
            v-else-if="activeProject"
            :key="`${record.id}-${activeProject.id}`"
            class="conversation-project-panel"
            data-chatlog-project-panel
          >
            <div class="conversation-heading">
              <span>PROJECT DOSSIER</span>
              <span>{{ activeProject.maturity }}</span>
            </div>
            <h3 class="conversation-title">
              {{ activeProject.name }}
            </h3>
            <p class="project-summary">
              {{ activeProject.summary }}
            </p>
            <ul class="project-facts">
              <li v-for="fact in activeProject.facts" :key="fact">
                {{ fact }}
              </li>
            </ul>
            <dl class="project-links">
              <div>
                <dt>HOMEPAGE</dt>
                <dd><a :href="activeProject.homepage" target="_blank" rel="noopener noreferrer">{{ activeProject.homepage }}</a></dd>
              </div>
              <div>
                <dt>DOCS</dt>
                <dd><a :href="activeProject.documentation" target="_blank" rel="noopener noreferrer">{{ activeProject.documentation }}</a></dd>
              </div>
            </dl>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.dispatch-quote-section {
  @media (min-width: 1024px) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.dispatch-quote-card {
  background-color: #10151f;
  border: 1px solid #272727;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  overflow: hidden;

  @media (min-width: 1024px) {
    flex: 1;
    min-height: 0;
  }

  .conversation-project-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .conversation-project-tab {
    border: 1px solid rgba(102, 179, 255, 0.25);
    border-radius: 999px;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 0.95rem;
    font-weight: 700;
    padding: 6px 12px;

    &.active {
      border-color: rgba(102, 179, 255, 0.55);
      background: rgba(59, 130, 246, 0.14);
      color: #ffffff;
    }
  }

  &:hover {
    border-color: rgba(var(--color-blue-rgb), 0.4);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }
}

.quote-viewport {
  position: relative;
  flex: 1;
  overflow: hidden;
  min-height: 0;

  .thesis-warning {
    margin: 0 0 18px;
    border-left: 2px solid var(--color-blue-light);
    padding-left: 12px;
    color: #d9f4ff;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 1.3rem;
    font-style: italic;
    line-height: 1.6;
    opacity: 0.8;
    animation: thesis-warning-fade 20s linear forwards;
  }

  @keyframes thesis-warning-fade {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.35;
    }
  }
}

.conversation-rotator {
  position: relative;
  padding-top: 4px;
  padding-right: 4px;
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

.conversation-project-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-summary,
.project-facts,
.project-links {
  margin: 0;
  color: #e2e8f0;
  line-height: 1.6;
}

.project-facts {
  padding-left: 20px;
}

.project-links {
  display: grid;
  gap: 8px;

  dt {
    color: #7dd3fc;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
  }

  dd {
    margin: 0;
  }

  a {
    color: #ffffff;
    overflow-wrap: anywhere;
    text-decoration: none;
  }
}

.conversation-message {
  border-left: 2px solid rgba(var(--color-blue-rgb), 0.45);
  padding-left: 16px;
}

.sfx-message {
  border-left: none;
  padding-left: 0;
  text-align: center;
  margin: 10px 0;
}

.sfx-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  color: var(--color-blue-light);
  font-style: italic;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  opacity: 0.8;
  margin: 0;
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
  font-size: 1.35rem;
  line-height: 1.55;
  white-space: pre-wrap;
}

.climax-sentence {
  display: inline;
}

.climax-fade-enter-active {
  transition: opacity 1s linear;
}

.climax-fade-enter-from {
  opacity: 0;
}

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
</style>
