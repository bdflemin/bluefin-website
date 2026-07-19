<script setup lang="ts">
import type { LoreViewProps } from '../lore'
import { computed } from 'vue'
import { deriveLoreTelemetry } from '../../../data/wolves-lore-records'
import { renderLoreParagraphs } from '../lore'

const props = defineProps<LoreViewProps>()

const telemetry = computed(() => deriveLoreTelemetry(props.record))
const specializations = computed(() => props.record.metadata.guardian?.specializations ?? [])
const guardianReference = computed(() => props.record.metadata.subject)
const bond = computed(() =>
  props.records?.find(record =>
    record.kind === 'guardian-bond'
    && record.metadata.relations?.guardian === guardianReference.value,
  ),
)

const paragraphs = computed(() => renderLoreParagraphs(props.record.body))
</script>

<template>
  <section
    class="lore-dossier-panel"
    data-lore-view="guardian-dossier"
  >
    <header class="lore-dossier-header">
      <p class="lore-dossier-eyebrow">
        MAINTAINER // GUARDIAN
      </p>
      <h2 v-if="record.metadata.title" class="lore-dossier-title">
        {{ record.metadata.title }}
      </h2>
      <p v-if="specializations.length" class="lore-dossier-subtitle">
        {{ specializations.join(' · ').toUpperCase() }}
      </p>
    </header>

    <div>
      <dl class="lore-spec lore-spec--boxed">
        <div v-if="record.metadata.guardian?.class">
          <dt>
            class:
          </dt>
          <dd>
            {{ record.metadata.guardian.class }}
          </dd>
        </div>
        <div v-if="record.metadata.guardian?.super">
          <dt>
            super:
          </dt>
          <dd>
            {{ record.metadata.guardian.super }}
          </dd>
        </div>
        <div v-if="record.metadata.aliases?.length">
          <dt>
            aliases:
          </dt>
          <dd>
            [{{ record.metadata.aliases.join(', ') }}]
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
        <div v-if="bond">
          <dt>
            GuardianBond:
          </dt>
          <dd>
            {{ bond.id }}
          </dd>
        </div>
      </dl>

      <aside class="lore-dossier-rail">
        <p class="lore-dossier-rail-label">
          STATUS RAIL
        </p>
        <p>
          {{ telemetry.phase }} · {{ telemetry.controller }}
        </p>
        <p>
          {{ telemetry.recordFingerprint }}
        </p>
      </aside>
    </div>

    <article class="lore-dossier-body">
      <p
        v-for="(para, index) in paragraphs"
        :key="index"

        v-html="para"
      />
    </article>
  </section>
</template>
