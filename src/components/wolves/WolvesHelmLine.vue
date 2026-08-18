<script setup lang="ts">
import { computed } from 'vue'

/**
 * A standfirst line whose separators are drawn as the Kubernetes helm.
 *
 * The copy is never edited here. This changes only how one glyph is PAINTED,
 * the same way `WolvesTrailerLine` draws the trailer's spaced pipe as a sear
 * and the `o` of WOLVES as the helm: the authored string still reads
 * "SEVEN PILLARS · ONE COMMUNITY · ONE DESTINY" in source, and the separator it
 * already contains is replaced in the render.
 *
 * The mark is `brands/kubernetes-icon-white.svg`, CNCF's published white
 * symbolic icon, reproduced unmodified.
 */
const props = withDefaults(defineProps<{
  text: string
  /** The authored glyph this line uses to separate its phrases. */
  separator?: string
}>(), {
  separator: '·',
})

const markSrc = `${import.meta.env.BASE_URL}brands/kubernetes-icon-white.svg`

/**
 * Split on the separator alone, never on the spaces around it. The line's own
 * word spacing and tracking then set the air around the mark, so it sits in
 * the gap the typography already made rather than one invented here.
 */
const parts = computed(() => props.text.split(props.separator))
</script>

<template>
  <span class="wc-helm-line">
    <template v-for="(part, index) in parts" :key="index">
      <!-- Decorative: the phrases are already separated in the accessible
           text, so announcing a mark between them adds nothing to read. -->
      <img
        v-if="index > 0"
        class="wc-helm-sep"
        :src="markSrc"
        alt=""
        aria-hidden="true"
      >{{ part }}
    </template>
  </span>
</template>

<style scoped lang="scss">
.wc-helm-line {
  display: inline;
}

/* THE SEPARATOR IS THE HELM.

   Sized against the cap, not the em: this line is set in uppercase mono, so
   the mark reads as a peer of the letterforms beside it rather than as a
   floating object. Seated by the cap's optical centre so it sits where the
   middot it replaces sat, not on the baseline.

   It carries the LINE'S weight, not white's. The type here is `--wc-grey`
   (#8b8f96) on `--wc-bg` (#08090c); a full-strength white mark between grey
   words reads as a highlight and pulls the eye off the copy. Alpha holds the
   published icon unmodified while landing it on the same tone as the words —
   a separator's whole job is to be felt and not looked at. */
.wc-helm-sep {
  // Tailwind's preflight sets `img { display: block }`. A block-level
  // separator takes its own line and breaks the phrase across three lines.
  display: inline;
  width: auto;
  height: 0.62em;
  vertical-align: 0.04em;
  opacity: 0.5;
}
</style>
