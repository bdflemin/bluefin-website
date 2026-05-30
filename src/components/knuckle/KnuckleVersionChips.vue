<script setup lang="ts">
import {
  IconAlertCircleOutline,
  IconCheckCircleOutline,
  IconDownload,
  IconGithubCircle,
  IconLoading,
} from '@iconify-prerendered/vue-mdi'
import { computed, onMounted, ref } from 'vue'

interface StreamData {
  version: string
  buildDate: string
  kernel: string
  systemd: string
  docker: string
  containerd: string
  ignition: string
  etcd: string
}

interface KnuckleVersions {
  generatedAt: string
  knuckleVersion: string
  streams: Record<string, StreamData>
}

interface ReleaseAsset {
  name: string
  browser_download_url: string
}

interface GithubRelease {
  tag_name: string
  html_url: string
  assets: ReleaseAsset[]
}

interface DownloadEntry {
  label: string
  arch: string
  isoFilename: string
  isoUrl: string
  checksumUrl: string
}

const GITHUB_RELEASES_API = 'https://api.github.com/repos/projectbluefin/knuckle/releases/latest'
const GITHUB_REPO = 'https://github.com/projectbluefin/knuckle'
const GITHUB_RELEASES_PAGE = `${GITHUB_REPO}/releases`

const STREAM_ORDER = ['stable', 'beta', 'lts', 'alpha']
const STREAM_LABELS: Record<string, string> = {
  stable: 'Stable',
  beta: 'Beta',
  lts: 'LTS',
  alpha: 'Alpha',
}
const SBOM_FIELDS: { key: keyof StreamData, label: string }[] = [
  { key: 'kernel', label: 'Kernel' },
  { key: 'systemd', label: 'systemd' },
  { key: 'containerd', label: 'containerd' },
  { key: 'docker', label: 'Docker' },
  { key: 'ignition', label: 'Ignition' },
  { key: 'etcd', label: 'etcd' },
]

const streams = ref<KnuckleVersions | null>(null)
const activeStream = ref('stable')

const dlLoading = ref(true)
const dlError = ref(false)
const dlVersion = ref<string | null>(null)
const dlEntries = ref<DownloadEntry[]>([])
const selectedArch = ref<'amd64' | 'arm64'>('amd64')

const activeStreamData = computed(() => streams.value?.streams[activeStream.value] ?? null)
const activeEntry = computed(() => dlEntries.value.find(e => e.arch === selectedArch.value) ?? dlEntries.value[0])

onMounted(async () => {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}knuckle-versions.json`)
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    streams.value = await res.json()
  }
  catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[KnuckleVersionChips] failed to load versions', e)
    }
  }

  try {
    const res = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const release: GithubRelease = await res.json()
    dlVersion.value = release.tag_name
    const assetMap = new Map(release.assets.map(a => [a.name, a.browser_download_url]))
    dlEntries.value = [
      { label: 'AMD / Intel (x86_64)', arch: 'amd64' },
      { label: 'ARM64', arch: 'arm64' },
    ].map(({ label, arch }) => {
      const isoFilename = `knuckle-installer-stable-${arch}.iso`
      const checksumFilename = `${isoFilename}.sha256`
      return {
        label,
        arch,
        isoFilename,
        isoUrl: assetMap.get(isoFilename) ?? `${GITHUB_RELEASES_PAGE}/download/${release.tag_name}/${isoFilename}`,
        checksumUrl: assetMap.get(checksumFilename) ?? `${GITHUB_RELEASES_PAGE}/download/${release.tag_name}/${checksumFilename}`,
      }
    })
  }
  catch (e) {
    if (import.meta.env.DEV) {
      console.warn('[KnuckleVersionChips] failed to fetch release:', e)
    }
    dlError.value = true
  }
  finally {
    dlLoading.value = false
  }
})
</script>

<template>
  <div class="streams-widget">
    <!-- ── Tabs ── -->
    <div class="tabs">
      <button
        v-for="key in STREAM_ORDER"
        :key="key"
        class="tab"
        :class="[`tab-${key}`, { active: activeStream === key }]"
        @click="activeStream = key"
      >
        {{ STREAM_LABELS[key] }}
      </button>
    </div>

    <!-- ── Panel ── -->
    <div v-if="streams && activeStreamData" class="panel">
      <!-- Left: identity + SBOM -->
      <div class="info">
        <div class="id-block">
          <div class="id-row">
            <span class="badge" :class="`badge-${activeStream}`">{{ STREAM_LABELS[activeStream] }}</span>
          </div>
          <div class="ver mono">
            {{ activeStreamData.version }}
          </div>
          <div class="meta">
            Flatcar Container Linux
            <span v-if="activeStreamData.buildDate"> · Built {{ activeStreamData.buildDate }}</span>
          </div>
        </div>

        <div class="sbom-grid">
          <div
            v-for="field in SBOM_FIELDS"
            :key="field.key"
            class="sbom-item"
          >
            <span class="sbom-key">{{ field.label }}</span>
            <span class="sbom-val mono">{{ activeStreamData[field.key] || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Right: download (stable) or info notice (others) -->
      <div class="dl-panel">
        <template v-if="activeStream === 'stable'">
          <div class="dl-label">
            Download
            <span v-if="dlVersion" class="dl-ver">{{ dlVersion }}</span>
          </div>

          <div class="arch-row">
            <button
              class="arch-btn"
              :class="{ active: selectedArch === 'amd64' }"
              @click="selectedArch = 'amd64'"
            >
              AMD / Intel (x86_64)
            </button>
            <button
              class="arch-btn"
              :class="{ active: selectedArch === 'arm64' }"
              @click="selectedArch = 'arm64'"
            >
              ARM64
            </button>
          </div>

          <div v-if="dlLoading" class="state-row">
            <IconLoading class="spin" />
            <span>Fetching release…</span>
          </div>
          <div v-else-if="dlError" class="state-row state-error">
            <IconAlertCircleOutline />
            <a :href="GITHUB_RELEASES_PAGE" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
          </div>
          <template v-else-if="activeEntry">
            <a class="dl-btn" :href="activeEntry.isoUrl" :download="activeEntry.isoFilename">
              <IconDownload />
              Download ISO
            </a>
            <a class="verify-link" :href="activeEntry.checksumUrl" target="_blank" rel="noopener noreferrer">
              <IconCheckCircleOutline />
              SHA-256 checksum
            </a>
          </template>

          <div class="dl-spacer" />
        </template>

        <template v-else>
          <div class="info-only">
            <span class="badge" :class="`badge-${activeStream}`">{{ STREAM_LABELS[activeStream] }}</span>
            <p>Informational only.<br>Switch to Stable to download.</p>
          </div>
        </template>

        <a class="gh-link" :href="GITHUB_REPO" target="_blank" rel="noopener noreferrer">
          <IconGithubCircle />
          View on GitHub
        </a>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-else class="panel-loading">
      <div class="state-row">
        <IconLoading class="spin" />
        <span>Loading…</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.streams-widget {
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(var(--color-bg-rgb), 0.55);
  backdrop-filter: blur(8px);
}

/* ── Tabs ── */
.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border-light);
  background: rgba(var(--color-bg-rgb), 0.4);
}
.tab {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text);
  opacity: 0.3;
  cursor: pointer;
  transition:
    opacity 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover:not(.active) {
    opacity: 0.55;
  }

  &.active {
    opacity: 1;
  }
  &.tab-stable.active {
    border-bottom-color: rgb(120, 220, 150);
    color: rgb(120, 220, 150);
  }
  &.tab-beta.active {
    border-bottom-color: var(--color-blue-light);
    color: var(--color-blue-light);
  }
  &.tab-lts.active {
    border-bottom-color: rgb(185, 155, 255);
    color: rgb(185, 155, 255);
  }
  &.tab-alpha.active {
    border-bottom-color: rgb(255, 185, 90);
    color: rgb(255, 185, 90);
  }
}

/* ── Panel ── */
.panel {
  display: grid;
  grid-template-columns: 1fr 200px;
  min-height: 220px;
}

/* Left: identity + SBOM */
.info {
  padding: 16px 18px;
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.id-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.id-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.ver {
  font-size: 1.9rem;
  line-height: 1;
  color: var(--color-text-light);
  letter-spacing: -0.01em;
}
.meta {
  font-size: 1.1rem;
  color: var(--color-text);
  opacity: 0.35;
}
.sbom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 20px;
}
.sbom-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sbom-key {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.35;
}
.sbom-val {
  font-size: 1.2rem;
  color: var(--color-blue-light);
  opacity: 0.9;
}

/* Right: download panel */
.dl-panel {
  padding: 16px 14px;
  background: rgba(var(--color-bg-rgb), 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dl-label {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text);
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.dl-ver {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  background: rgba(var(--color-blue-rgb), 0.15);
  border: 1px solid rgba(var(--color-blue-rgb), 0.25);
  border-radius: 3px;
  padding: 1px 6px;
  color: var(--color-text-light);
  opacity: 1;
  font-weight: 700;
}
.dl-spacer {
  flex: 1;
}

.arch-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.arch-btn {
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  border: 1px solid transparent;
  background: rgba(var(--color-bg-rgb), 0.4);
  color: var(--color-text);
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;

  &.active {
    border-color: rgba(var(--color-blue-rgb), 0.5);
    background: rgba(var(--color-blue-rgb), 0.12);
    color: var(--color-blue-light);
  }
  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.06);
  }
}

.dl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 0;
  border-radius: 7px;
  font-size: 1.25rem;
  font-weight: 700;
  background: rgba(var(--color-blue-rgb), 0.9);
  color: white;
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: rgba(var(--color-blue-rgb), 1);
  }
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
}

.verify-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 1.05rem;
  color: var(--color-text);
  opacity: 0.35;
  text-decoration: none;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.7;
    text-decoration: underline;
  }
  svg {
    width: 1.2rem;
    height: 1.2rem;
  }
}

.info-only {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  opacity: 0.5;

  p {
    font-size: 1.1rem;
    line-height: 1.5;
    color: var(--color-text);
  }
}

.gh-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-text-light);
  text-decoration: none;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: rgba(var(--color-bg-rgb), 0.3);
  transition:
    border-color 0.2s,
    background 0.2s;

  &:hover {
    border-color: var(--color-blue-light);
    background: rgba(var(--color-blue-rgb), 0.08);
  }
  svg {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }
}

/* shared */
.badge {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.badge-stable {
  background: rgba(80, 200, 120, 0.2);
  color: rgb(120, 220, 150);
  border: 1px solid rgba(80, 200, 120, 0.3);
}
.badge-beta {
  background: rgba(var(--color-blue-rgb), 0.2);
  color: var(--color-blue-light);
  border: 1px solid rgba(var(--color-blue-rgb), 0.3);
}
.badge-lts {
  background: rgba(160, 120, 255, 0.15);
  color: rgb(185, 155, 255);
  border: 1px solid rgba(160, 120, 255, 0.3);
}
.badge-alpha {
  background: rgba(255, 160, 50, 0.15);
  color: rgb(255, 185, 90);
  border: 1px solid rgba(255, 160, 50, 0.3);
}
.rec-badge {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(var(--color-blue-rgb), 0.85);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
}
.mono {
  font-family: 'Courier New', monospace;
  font-weight: 700;
}

.state-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  color: var(--color-text);
  svg {
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
  }
  a {
    color: var(--color-blue-light);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
.state-error {
  opacity: 0.7;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.panel-loading {
  padding: 24px 18px;
}

@media (max-width: 640px) {
  .panel {
    grid-template-columns: 1fr;
  }
  .info {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }
  .arch-row {
    flex-direction: row;
  }
  .arch-btn {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .streams-widget {
    .dl-label,
    .arch-row,
    .dl-btn,
    .verify-link,
    .info-only,
    .state-row {
      display: none;
    }
  }
  .dl-panel {
    padding: 12px;
    gap: 0;
    background: none;
  }
  .gh-link {
    margin: 0;
  }
}
</style>
