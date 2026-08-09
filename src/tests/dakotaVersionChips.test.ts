import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DakotaVersionChips from '../components/dakota/DakotaVersionChips.vue'

const VERSIONS_JSON = {
  generatedAt: '2026-08-01T00:00:00Z',
  packages: {
    kernel: '6.19.11',
    gnome: '50.0',
    mesa: '',
    baseline: 'x86-64-v3',
  },
}

function mountChips(props: { keys?: string[] } = {}) {
  return mount(DakotaVersionChips, { props })
}

describe('dakotaVersionChips.vue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders chips for every non-empty package with mapped labels', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => VERSIONS_JSON,
    })))

    const wrapper = mountChips()
    await flushPromises()

    const chips = wrapper.findAll('.version-chip')
    // mesa is an empty string in the payload and must be filtered out.
    expect(chips).toHaveLength(3)
    expect(chips.map(chip => chip.get('.chip-label').text())).toEqual([
      'Kernel',
      'GNOME',
      'x86-64',
    ])
    expect(chips.map(chip => chip.get('.chip-value').text())).toEqual([
      '6.19.11',
      '50.0',
      'x86-64-v3',
    ])
  })

  it('flags the baseline chip as a feature chip', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => VERSIONS_JSON,
    })))

    const wrapper = mountChips()
    await flushPromises()

    const featureChips = wrapper.findAll('.version-chip.chip-feature')
    expect(featureChips).toHaveLength(1)
    expect(featureChips[0].get('.chip-label').text()).toBe('x86-64')
  })

  it('limits chips to the requested keys', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => VERSIONS_JSON,
    })))

    const wrapper = mountChips({ keys: ['kernel'] })
    await flushPromises()

    const chips = wrapper.findAll('.version-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].get('.chip-label').text()).toBe('Kernel')
  })
})
