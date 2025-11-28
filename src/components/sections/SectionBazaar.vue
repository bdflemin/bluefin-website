<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from "vue-i18n"
import type { MessageSchema } from "../../locales/schema"

const { t } = useI18n<MessageSchema>({
  useScope: "global"
})

onMounted(() => {
  // Word rotation animation
  const words = document.querySelectorAll('.anim-word')
  let currentWord = 0
  
  setInterval(() => {
    words.forEach((word, index) => {
      (word as HTMLElement).style.opacity = index === currentWord ? '1' : '0'
    })
    currentWord = (currentWord + 1) % words.length
  }, 2000)
})
</script>

<template>
  <section id="bazaar" class="section-wrap bazaar-section">
    <div class="app-background-container">
      <div class="tilt-container">
        <img loading="lazy" class="apps-bg1 floating" src="/img/distros_apps_1.webp" alt="Background apps 1">
        <img loading="lazy" class="apps-bg2 floating" src="/img/distros_apps_2.webp" alt="Background apps 2">
        <img loading="lazy" class="apps-bg3 floating" src="/img/distros_apps_3.webp" alt="Background apps 3">
      </div>
    </div>

    <div class="container bazaar-content">
      <div class="bazaar-header">
        <h2 class="title-apps">
          {{ t("Bazaar.Header.Text1") }}<span class="space">&nbsp;</span>
          <div class="anim-word-container">
            <span class="anim-word">{{ t("Bazaar.Header.Word1") }}</span>
            <span class="anim-word">{{ t("Bazaar.Header.Word2") }}</span>
            <span class="anim-word">{{ t("Bazaar.Header.Word3") }}</span>
          </div>
          <span class="word-placement">{{ t("Bazaar.Header.Word1") }}</span>
        </h2>
      </div>

      <div class="bazaar-main">
        <div class="bazaar-description">
          <p v-html="t('Bazaar.Description')"></p>
          <div class="bazaar-screenshot">
            <img 
              src="/img/bazaar2.webp" 
              alt="Screenshot of Bluefin's Flatpak Store, Bazaar"
              loading="lazy"
            />
            <img 
              src="/img/bazaar.svg" 
              class="bazaar-icon" 
              alt="Bazaar's Icon"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div class="bazaar-additional">
        <p v-html="t('Bazaar.Additional')"></p>
      </div>

      <div class="bazaar-buttons">
        <a class="bazaar-button" href="https://flathub.org/" target="_blank">
          <span class="button-label">{{ t("Bazaar.Button1") }}</span>
        </a>
        <a class="bazaar-button" href="https://docs.projectbluefin.io" target="_blank">
          <span class="button-label">{{ t("Bazaar.Button2") }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.bazaar-section {
  background-color: var(--color-bg);
  position: relative;
  overflow: hidden;
  padding: 128px 0;
}

.app-background-container {
  pointer-events: none;
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  margin: auto;
  top: 50px;
  z-index: 0;
}

.tilt-container {
  transform-style: preserve-3d;
  position: relative;
  width: 100%;
  height: 100%;
}

.floating {
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  margin: auto;
  animation: float 6s ease-in-out infinite;
}

.apps-bg1 {
  filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.5));
  animation-delay: 0s;
}

.apps-bg2 {
  filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.5));
  animation-delay: 2s;
}

.apps-bg3 {
  filter: drop-shadow(0px 0px 7px rgba(0, 0, 0, 0.5));
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

.bazaar-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.bazaar-header {
  text-align: center;
  margin-bottom: 60px;

  .title-apps {
    font-family: Inter;
    font-weight: 700;
    font-size: 7rem;
    text-transform: uppercase;
    color: var(--color-text-light);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .anim-word-container {
    position: relative;
    display: inline-block;
    height: 1.2em;
    vertical-align: top;
  }

  .anim-word {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    white-space: nowrap;

    &:first-child {
      opacity: 1;
    }
  }

  .word-placement {
    visibility: hidden;
    white-space: nowrap;
  }
}

.bazaar-main {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.bazaar-description {
  max-width: 800px;
  text-align: left;

  p {
    font-size: 1.8rem;
    line-height: 1.6;
    color: var(--color-text-light);
    margin-bottom: 20px;

    a {
      color: var(--color-blue-light);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.bazaar-screenshot {
  position: relative;
  margin-top: 20px;

  img:first-child {
    width: 100%;
    height: auto;
    border-radius: 10px;
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.5);
    display: block;
  }
}

.bazaar-icon {
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 64px !important;
  height: 64px !important;
  filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.5));
}

.bazaar-additional {
  max-width: 800px;
  margin: 0 auto 40px;
  text-align: left;

  p {
    font-size: 1.6rem;
    line-height: 1.6;
    color: var(--color-text-light);

    a {
      color: var(--color-blue-light);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.bazaar-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 40px;
}

.bazaar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: var(--color-blue);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 1.6rem;
  font-weight: 600;
  transition: background 0.3s ease;
  min-width: 200px;

  &:hover {
    background: var(--color-blue-dark, #0056b3);
  }
}

@media (max-width: 768px) {
  .bazaar-header .title-apps {
    font-size: 4rem;
  }

  .bazaar-description p {
    font-size: 1.6rem;
  }

  .bazaar-additional p {
    font-size: 1.4rem;
  }

  .bazaar-buttons {
    flex-direction: column;
    align-items: center;
  }

  .bazaar-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
