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
    data-lore-view="location-dossier"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        LOCATION DOSSIER
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
    </header>

    <dl class="lore-spec lore-spec--boxed">
      <div v-if="record.metadata.subject">
        <dt>
          site:
        </dt>
        <dd>
          {{ record.metadata.subject }}
        </dd>
      </div>
      <div v-if="record.metadata.affiliation">
        <dt>
          control:
        </dt>
        <dd>
          {{ record.metadata.affiliation }}
        </dd>
      </div>
      <div v-if="record.metadata.classification">
        <dt>
          classification:
        </dt>
        <dd>
          {{ record.metadata.classification }}
        </dd>
      </div>
    </dl>

    <article class="lore-dossier-body">
      <p
        v-for="(para, index) in paragraphs"
        :key="index"

        v-html="para"
      />
    </article>
  </section>
</template>
