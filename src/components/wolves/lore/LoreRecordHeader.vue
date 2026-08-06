<script setup lang="ts">
// The single metadata block for every Wolves lore record.
//
// Every kind gets the same three lines in the same order — kind eyebrow,
// record title, then one inline spec row of at most three pairs — so the
// chrome never appears to change shape between records on a theater screen.
// Views supply the values; they do not supply the layout.

export interface LoreSpecEntry {
  key: string
  value: string
}

defineProps<{
  eyebrow: string
  title?: string
  spec?: readonly LoreSpecEntry[]
}>()
</script>

<template>
  <header class="lore-dossier-header" data-lore-header>
    <p class="lore-dossier-eyebrow" data-lore-eyebrow>
      {{ eyebrow }}
    </p>
    <h2 class="lore-dossier-title" data-lore-title>
      {{ title || '—' }}
    </h2>
    <p v-if="spec?.length || $slots.spec" class="lore-spec" data-lore-spec>
      <slot name="spec">
        <span v-for="entry in spec?.slice(0, 3)" :key="entry.key">
          <span class="lore-spec-key">{{ entry.key }}:</span> {{ entry.value }}
        </span>
      </slot>
    </p>
  </header>
</template>
