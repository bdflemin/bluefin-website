<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { estimateLoreReadDuration } from '@/data/wolves-lore-timing'
import { getQuoteLore } from '../lore'
import { splitReadableBeats } from './readable-beats'

const props = defineProps<LoreViewProps>()

const quote = computed(() => getQuoteLore(props.record))
const typedQuoteText = ref('')
const activeBeatIndex = ref(0)
const quoteBeats = computed(() => splitReadableBeats(quote.value.quote, 110))
const QUOTE_BEAT_HOLD_MS = 1500
let typewriterTimer: ReturnType<typeof setInterval> | null = null

function clearTypewriter() {
  if (typewriterTimer) {
    clearInterval(typewriterTimer)
    typewriterTimer = null
  }
}

function runTypewriter() {
  clearTypewriter()
  typedQuoteText.value = ''
  activeBeatIndex.value = 0

  const targetText = quote.value.quote
  const minimumReadSeconds = estimateLoreReadDuration({ kind: 'quote', body: targetText, attribution: quote.value.attribution })
  const readableBudgetMs = Math.max(1, Math.min(props.duration, minimumReadSeconds) * 1000 * 0.7)
  const stepTime = Math.max(5, Math.min(50, readableBudgetMs / Math.max(1, targetText.length + quoteBeats.value.length - 1)))
  let index = 0
  let pauseTicks = 0
  let beatComplete = false

  typewriterTimer = setInterval(() => {
    if (pauseTicks > 0) {
      pauseTicks--
      return
    }

    if (beatComplete) {
      activeBeatIndex.value++
      typedQuoteText.value = ''
      index = 0
      beatComplete = false
      return
    }

    const activeBeat = quoteBeats.value[activeBeatIndex.value]
    if (!activeBeat) {
      clearTypewriter()
      return
    }

    index++
    typedQuoteText.value = activeBeat.slice(0, index)

    if (index >= activeBeat.length) {
      if (activeBeatIndex.value === quoteBeats.value.length - 1) {
        clearTypewriter()
        return
      }

      beatComplete = true
      pauseTicks = Math.ceil(QUOTE_BEAT_HOLD_MS / stepTime)
    }
  }, stepTime)
}

watch(() => props.record, runTypewriter, { immediate: true })

onBeforeUnmount(clearTypewriter)
</script>

<template>
  <section
    id="intercepted-communications"
    class="dispatch-quote-section comic-reader-section"
    data-lore-view-kind="quote"
  >
    <div class="dispatch-quote-card">
      <div class="quote-viewport" :aria-label="`${quote.quote} — ${quote.attribution}`" role="article">
        <p v-if="warning" class="thesis-warning">
          {{ warning }}
        </p>
        <Transition name="quote-fade">
          <div :key="record.id" class="conversation-rotator">
            <div class="lore-quote">
              <div class="lore-quote-mark">
                &ldquo;
              </div>
              <p class="lore-quote-text" :data-quote-beat-index="activeBeatIndex">
                {{ typedQuoteText }}
              </p>
              <div class="lore-quote-meta">
                <strong>{{ quote.attribution }}</strong>
                <span v-if="quote.context" data-lore-quote-context>
                  {{ quote.context }}
                </span>
                <time v-if="quote.date" :datetime="quote.date">
                  {{ quote.date }}
                </time>
              </div>
            </div>
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
  padding-right: 8px;

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
  font-size: 1.45rem;
  font-style: italic;
  line-height: 1.55;
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
