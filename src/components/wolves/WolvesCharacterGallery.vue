<script setup lang="ts">
/**
 * Guardian character gallery, appended below the Back Catalogue on the Wolves
 * lobby. Cards come from public/wolves/characters/characters.json, generated
 * by scripts/guardian-cards/generate.mjs. Each card links to that Guardian's
 * scene in the official Destiny 2 trailer on YouTube.
 */
import { onMounted, ref } from 'vue'

const DONATE_URL = 'https://github.com/sponsors/castrojo'

interface CharacterCard {
  slug: string
  shortName: string
  label: string
  class: string
  name: string
  title: string
  card: string
  watchUrl: string
  videoTitle: string
}

const characters = ref<CharacterCard[]>([])

function resolveCard(card: string): string {
  return `${import.meta.env.BASE_URL}${card}`
}

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}wolves/characters/characters.json`)
    if (!response.ok) {
      return
    }
    const payload = await response.json() as { characters?: CharacterCard[] }
    characters.value = Array.isArray(payload.characters) ? payload.characters : []
  }
  catch {
    // The gallery is additive; the lobby renders without it on failure.
  }
})
</script>

<template>
  <section v-if="characters.length > 0" class="wc-character-gallery" aria-label="Character Gallery">
    <p class="wc-label wc-character-gallery-heading">
      IMMORTALIZE A MAINTAINER
    </p>
    <div class="wc-hairline" />
    <p class="wc-character-gallery-intro">
      Every donation immortalizes the maintainers who inspired this project. Real
      artists will work directly with each maintainer to represent their vision of
      themselves in the Bluefin universe.
    </p>
    <div class="wc-character-gallery-grid">
      <article
        v-for="character in characters"
        :key="character.slug"
        class="wc-character-card wc-plate"
      >
        <a
          class="wc-character-card-watch"
          :href="character.watchUrl"
          target="_blank"
          rel="noopener"
        >
          <img
            class="wc-character-card-art"
            :src="resolveCard(character.card)"
            :alt="`${character.class} — ${character.name} character card`"
            loading="lazy"
          >
        </a>
        <span class="wc-character-card-name">{{ character.name }} inspired me</span>
        <span class="wc-character-card-sub">{{ character.class }} · {{ character.title }}</span>
        <a
          class="wc-character-card-donate"
          :href="DONATE_URL"
          target="_blank"
          rel="noopener noreferrer"
        >
          DONATE TO IMMORTALIZE {{ character.shortName.toUpperCase() }}
        </a>
      </article>
    </div>
    <p class="wc-character-gallery-disclaimer">
      Destiny 2 © Bungie, Inc. Fan-made, non-commercial community art — not affiliated with or endorsed by Bungie.
    </p>
  </section>
</template>

<style scoped lang="scss">
.wc-character-gallery {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin-top: 2.4rem;
}

.wc-character-gallery-heading {
  font-size: clamp(1.3rem, 1.3vw, 1.6rem);
  letter-spacing: 0.4em;
}

.wc-character-gallery-intro {
  font-family: var(--wc-font-mono);
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--wc-grey);
  max-width: 64ch;
}

.wc-character-gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1.6rem;
}

.wc-character-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem;
  text-align: left;
  transition: border-color 0.15s ease;

  &:hover,
  &:focus-within {
    border-color: var(--wc-gold);
  }
}

.wc-character-card-watch {
  display: block;
}

.wc-character-card-art {
  width: 100%;
  aspect-ratio: 1200 / 630;
  object-fit: cover;
  display: block;
}

.wc-character-card-name {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--wc-white);
}

.wc-character-card-sub {
  font-family: var(--wc-font-mono);
  font-size: 1.1rem;
  line-height: 1.5;
  color: var(--wc-grey);
}

.wc-character-card-donate {
  align-self: flex-start;
  margin-top: 0.4rem;
  padding: 0.6rem 1.4rem;
  border: 1px solid var(--wc-gold);
  font-family: var(--wc-font-mono);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--wc-gold);
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover,
  &:focus-visible {
    background-color: var(--wc-gold);
    color: #0b0d12;
  }
}

.wc-character-gallery-disclaimer {
  font-family: var(--wc-font-mono);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--wc-grey);
}
</style>
