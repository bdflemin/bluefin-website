<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { deriveLoreTelemetry } from '../../../data/wolves-lore-records'

const props = defineProps<LoreViewProps>()

const telemetry = computed(() => deriveLoreTelemetry(props.record))

const formattedBody = computed(() => {
  const escaped = props.record.body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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

    <p class="my-4 whitespace-pre-wrap text-lg leading-6 text-slate-100" v-html="formattedBody" />

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

.news-bulletin > p {
  margin: 16px 0;
  color: #f1f5f9;
  font-size: 1.7rem;
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
