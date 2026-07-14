<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { deriveLoreTelemetry } from '../../../data/wolves-lore-records'

const props = defineProps<LoreViewProps>()

const telemetry = computed(() => deriveLoreTelemetry(props.record))

const parsedParagraphs = computed(() => {
  const cleanBody = props.record.body.replace(/\r\n/g, '\n')
  const normalizedBody = cleanBody.replace(/\n(?=(?:\*\*[^*]+\*\*|[A-Z0-9\-/]+(?:\s+[A-Z0-9\-/]+)*)(?:\s+\[[^\]]+\])?:|<[^>]+>)/gi, '\n\n')
  return normalizedBody
    .split(/\n{2,}/)
    .map(para => para.trim())
    .filter(Boolean)
    .map((para) => {
      const match = para.match(/^(?:\*\*([^*]+)\*\*|([A-Z0-9\s\-/]+)):\s*(\S[\s\S]*)$/i)
      if (match) {
        const speaker = (match[1] || match[2]).trim()
        let text = match[3].trim()
        text = text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return {
          isSpeaker: true,
          speaker,
          text,
        }
      }
      const escaped = para
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      const text = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      return {
        isSpeaker: false,
        speaker: '',
        text,
      }
    })
})
</script>

<template>
  <section
    class="news-bulletin"
    data-lore-view="news-bulletin"
  >
    <header class="border-b border-blue-300/25 pb-3">
      <p class="m-0 text-base tracking-[0.2em] text-blue-300">
        NEWS BULLETIN
      </p>
      <h2 v-if="record.metadata.title" class="mb-0 mt-2 text-3xl text-white">
        {{ record.metadata.title }}
      </h2>
      <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-base text-slate-300">
        <time v-if="record.metadata.timestamp" :datetime="record.metadata.timestamp">
          DATELINE / {{ record.metadata.timestamp }}
        </time>
        <span v-if="record.metadata.classification">
          CLASSIFICATION / {{ record.metadata.classification }}
        </span>
      </div>
    </header>

    <aside
      v-if="warning"
      class="thesis-warning-fade mt-4 border-l-2 border-blue-300 pl-3 text-lg italic leading-6 text-blue-100"
      data-lore-warning
    >
      {{ warning }}
    </aside>

    <div class="my-4 flex-1 news-body-content">
      <div
        v-for="(para, index) in parsedParagraphs"
        :key="index"
        class="news-para-block"
        :style="{ animationDelay: `${index * 0.2}s` }"
      >
        <template v-if="para.isSpeaker">
          <div class="news-speaker-message">
            <span class="news-speaker-name">{{ para.speaker }}</span>
            <p v-html="para.text" />
          </div>
        </template>
        <template v-else>
          <p class="news-raw-text" v-html="para.text" />
        </template>
      </div>
    </div>

    <footer class="mt-auto border-t border-blue-300/25 pt-3 text-base text-blue-200">
      STATUS / {{ telemetry.phase }} · {{ telemetry.resourceName }} · {{ telemetry.recordFingerprint }}
    </footer>
  </section>
</template>

<style scoped>
.news-bulletin {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid rgba(102, 179, 255, 0.25);
  border-radius: 16px;
  padding: 16px;
  background: rgba(16, 21, 31, 0.45);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.news-bulletin header {
  border-bottom: 1px solid rgba(var(--color-blue-rgb), 0.25);
  padding-bottom: 12px;
}

.news-bulletin header > p {
  margin: 0;
  color: var(--color-blue-light);
  font-size: 1.35rem;
  letter-spacing: 0.2em;
}

.news-bulletin h2 {
  margin: 8px 0 0;
  color: #ffffff;
  font-size: 1.95rem;
}

.news-bulletin header > div {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 12px;
  color: rgba(226, 232, 240, 0.9);
  font-size: 1.25rem;
}

.news-body-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-para-block {
  margin: 0;
}

.news-speaker-message {
  border-left: 2px solid rgba(var(--color-blue-rgb), 0.45);
  padding-left: 14px;
  margin: 4px 0;
}

.news-speaker-name {
  display: block;
  color: var(--color-blue-light);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 1.15rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.news-speaker-message > p,
.news-raw-text {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.65rem;
  line-height: 1.65;
  white-space: pre-wrap;
}

.news-bulletin footer {
  margin-top: auto;
  border-top: 1px solid rgba(var(--color-blue-rgb), 0.25);
  padding-top: 12px;
  color: #bae6fd;
  font-size: 1.25rem;
  overflow-wrap: anywhere;
}

.thesis-warning-fade {
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
</style>
