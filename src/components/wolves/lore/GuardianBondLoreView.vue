<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { validateGuardianBonds } from '../../../data/wolves-lore-records'
import { renderLoreParagraphs } from '../lore'

const props = defineProps<LoreViewProps>()

const guardian = computed(() => {
  const reference = props.record.metadata.relations?.guardian
  return props.records?.find(record =>
    record.id === reference || record.metadata.subject === reference,
  )
})
const dinosaur = computed(() => {
  const reference = props.record.metadata.relations?.dinosaur
  return props.records?.find(record =>
    record.id === reference || record.metadata.subject === reference,
  )
})
const validationState = computed(() => {
  if (!guardian.value || !dinosaur.value) {
    return 'UNRESOLVED'
  }

  try {
    validateGuardianBonds([guardian.value, dinosaur.value, props.record])
    return 'RECIPROCAL / VALID'
  }
  catch {
    return 'RECIPROCAL / INVALID'
  }
})

const paragraphs = computed(() => renderLoreParagraphs(props.record.body))
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="guardian-bond"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        GUARDIANBOND
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
    </header>

    <dl class="lore-spec lore-spec--boxed">
      <div v-if="record.metadata.relations?.guardian">
        <dt>
          guardian:
        </dt>
        <dd>
          {{ record.metadata.relations.guardian }}
        </dd>
      </div>
      <div v-if="record.metadata.relations?.dinosaur">
        <dt>
          dinosaur:
        </dt>
        <dd>
          {{ record.metadata.relations.dinosaur }}
        </dd>
      </div>
      <div>
        <dt>
          validation:
        </dt>
        <dd>
          {{ validationState }}
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
