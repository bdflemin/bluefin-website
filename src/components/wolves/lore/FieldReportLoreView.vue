<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { renderLoreParagraphs } from '../lore'

const props = defineProps<LoreViewProps>()

const paragraphs = computed(() => renderLoreParagraphs(props.record.body))
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="field-report"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        FIELD REPORT
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
      <dl class="lore-spec">
        <div v-if="record.metadata.sender">
          <dt>
            observer:
          </dt>
          <dd>
            {{ record.metadata.sender }}
          </dd>
        </div>
        <div v-if="record.metadata.location">
          <dt>
            location:
          </dt>
          <dd>
            {{ record.metadata.location }}
          </dd>
        </div>
        <div v-if="record.metadata.subject">
          <dt>
            subject:
          </dt>
          <dd>
            {{ record.metadata.subject }}
          </dd>
        </div>
      </dl>
    </header>

    <article class="lore-dossier-body">
      <p
        v-for="(para, index) in paragraphs"
        :key="index"

        v-html="para"
      />
    </article>
  </section>
</template>
