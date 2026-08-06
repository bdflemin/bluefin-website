<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { getQuoteLore } from '../lore'
import { loreProsePages, pickPageIndexForElapsed } from './lore-pages'
import LoreRecordHeader from './LoreRecordHeader.vue'

const props = defineProps<LoreViewProps>()

const quote = computed(() => getQuoteLore(props.record))
// Prose pages: nothing shorter than a full page ever splits.
const quotePages = computed(() => loreProsePages(quote.value.quote))
const activeBeatIndex = computed(() =>
  pickPageIndexForElapsed(quotePages.value, props.elapsed, props.duration),
)
const activeQuoteBeat = computed(() => quotePages.value[activeBeatIndex.value] ?? quote.value.quote)
</script>

<template>
  <section
    id="intercepted-communications"
    class="lore-dossier-panel"
    data-lore-view="quote"
    data-lore-view-kind="quote"
  >
    <LoreRecordHeader eyebrow="QUOTE" :title="record.metadata.title">
      <template #spec>
        <span class="lore-quote-meta">
          <strong>{{ quote.attribution }}</strong>
        </span>
        <span v-if="quote.context" data-lore-quote-context>
          {{ quote.context }}
        </span>
        <time v-if="quote.date" :datetime="quote.date">
          {{ quote.date }}
        </time>
      </template>
    </LoreRecordHeader>

    <aside
      v-if="warning"
      class="lore-dossier-warning thesis-warning-fade"
      data-lore-warning
    >
      {{ warning }}
    </aside>

    <div class="quote-viewport" :aria-label="`${quote.quote} — ${quote.attribution}`" role="article">
      <Transition name="quote-fade">
        <div :key="record.id" class="lore-quote">
          <div class="lore-quote-mark">
            &ldquo;
          </div>
          <p class="lore-quote-text" :data-quote-beat-index="activeBeatIndex">
            {{ activeQuoteBeat }}
          </p>
        </div>
      </Transition>
    </div>
  </section>
</template>
