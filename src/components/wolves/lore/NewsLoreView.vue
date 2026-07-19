<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { deriveLoreTelemetry } from '../../../data/wolves-lore-records'
import { parseLoreSpeakerParagraphs } from '../lore'

const props = defineProps<LoreViewProps>()

const telemetry = computed(() => deriveLoreTelemetry(props.record))

const parsedParagraphs = computed(() => parseLoreSpeakerParagraphs(props.record.body))
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="news-bulletin"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        NEWS BULLETIN
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
      <div class="lore-spec lore-spec--inline">
        <time v-if="record.metadata.timestamp" :datetime="record.metadata.timestamp">
          <span class="lore-spec-key">dateline:</span> {{ record.metadata.timestamp }}
        </time>
        <span v-if="record.metadata.classification">
          <span class="lore-spec-key">classification:</span> {{ record.metadata.classification }}
        </span>
      </div>
    </header>

    <aside
      v-if="warning"
      class="lore-dossier-warning thesis-warning-fade"
      data-lore-warning
    >
      {{ warning }}
    </aside>

    <div class="news-body-content">
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

    <footer class="lore-dossier-footer">
      <span class="lore-spec-key">status:</span> {{ telemetry.phase }} · {{ telemetry.resourceName }} · {{ telemetry.recordFingerprint }}
    </footer>
  </section>
</template>

<style scoped>
.news-body-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0;
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
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.news-speaker-message > p,
.news-raw-text {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
  line-height: 1.65;
  white-space: pre-wrap;
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
