<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { dinosaurSpecies } from '../../../data/wolves-dinosaur-species'

const props = defineProps<LoreViewProps>()

const species = computed(() =>
  dinosaurSpecies.find(entry => entry.id === props.record.metadata.species),
)
const bond = computed(() => {
  const rider = props.record.metadata.relations?.riders?.[0]
  return props.records?.find(record => record.id === rider)
})
const guardian = computed(() => {
  const guardianReference = bond.value?.metadata.relations?.guardian
  return props.records?.find(record =>
    record.id === guardianReference || record.metadata.subject === guardianReference,
  )
})
const artworkSource = computed(() =>
  species.value
    ? `${import.meta.env.BASE_URL}${species.value.artwork.slice(2)}`
    : undefined,
)
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="dinosaur-dossier"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        DINOSAUR // SUBJECT PROFILE
      </p>
      <h2 v-if="record.metadata.epic_name" class="lore-dossier-title">
        {{ record.metadata.epic_name }}
      </h2>
    </header>

    <dl class="lore-spec lore-spec--boxed">
      <div v-if="species">
        <dt>
          species:
        </dt>
        <dd>
          {{ species.scientificName }}
        </dd>
      </div>
      <div v-if="guardian">
        <dt>
          rider:
        </dt>
        <dd>
          {{ guardian.metadata.title || guardian.metadata.subject }}
        </dd>
      </div>
      <div v-if="bond">
        <dt>
          bond:
        </dt>
        <dd>
          {{ bond.id }}
        </dd>
      </div>
      <div v-if="record.metadata.titles?.length">
        <dt>
          titles:
        </dt>
        <dd>
          [{{ record.metadata.titles.join(', ') }}]
        </dd>
      </div>
    </dl>

    <article class="lore-dossier-body">
      <p>{{ record.body }}</p>
    </article>

    <figure v-if="species && artworkSource" class="lore-dossier-figure">
      <img
        :src="artworkSource"
        :alt="species.scientificName"
        data-species-artwork
      >
    </figure>
  </section>
</template>
