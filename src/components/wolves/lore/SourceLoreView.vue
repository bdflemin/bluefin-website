<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { deriveLoreTelemetry } from '../../../data/wolves-lore-records'
import { getSourceProvenance, parseLoreSpeakerParagraphs } from '../lore'

const props = defineProps<LoreViewProps>()

const telemetry = computed(() => deriveLoreTelemetry(props.record))
const provenance = computed(() => getSourceProvenance(props.record))

const parsedParagraphs = computed(() => parseLoreSpeakerParagraphs(props.record.body))
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="source-fragment"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        SOURCE FRAGMENT
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
      <dl class="lore-spec">
        <div v-if="provenance">
          <dt>
            provenance:
          </dt>
          <dd>
            {{ provenance }}
          </dd>
        </div>
        <div v-if="record.metadata.channel">
          <dt>
            collection:
          </dt>
          <dd>
            {{ record.metadata.channel }}
          </dd>
        </div>
      </dl>
    </header>

    <blockquote class="source-body-content">
      <div
        v-for="(para, index) in parsedParagraphs"
        :key="index"
        class="source-para-block"
      >
        <template v-if="para.isSpeaker">
          <div class="source-speaker-message">
            <span class="source-speaker-name">{{ para.speaker }}</span>
            <p v-html="para.text" />
          </div>
        </template>
        <template v-else>
          <p class="source-raw-text" v-html="para.text" />
        </template>
      </div>
    </blockquote>

    <footer class="lore-dossier-footer">
      <span class="lore-spec-key">fingerprint:</span> {{ telemetry.recordFingerprint }}
    </footer>
  </section>
</template>

<style scoped lang="scss">
.source-body-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 16px 0;
  border-left: 2px solid rgba(var(--color-blue-rgb), 0.5);
  padding-left: 12px;
}

.source-para-block {
  margin: 0;
}

.source-speaker-message {
  margin: 4px 0;
}

.source-speaker-name {
  display: block;
  color: var(--color-blue-light);
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.source-speaker-message > p,
.source-raw-text {
  margin: 0;
  color: #f1f5f9;
  font-size: 1.25rem;
  line-height: 1.65;
  white-space: pre-wrap;
}
</style>
