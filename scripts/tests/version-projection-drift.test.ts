import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { IMAGE_SBOM_REGISTRY } from '../lib/image-sbom-registry.js'

describe('version projection and consumer drift gate', () => {
  const rootDir = join(import.meta.dirname, '../..')

  const dakotaRegistryKeys = new Set(
    IMAGE_SBOM_REGISTRY.filter(r => r.product === 'dakota')
      .flatMap(r => Object.keys(r.packages)),
  )

  const bluefinRegistryKeys = new Set(
    IMAGE_SBOM_REGISTRY.filter(r => r.product === 'bluefin')
      .flatMap(r => Object.keys(r.packages)),
  )

  it('registry defines expected base package sets for both products', () => {
    expect(dakotaRegistryKeys.size).toBeGreaterThan(0)
    expect(bluefinRegistryKeys.size).toBeGreaterThan(0)
    expect(dakotaRegistryKeys).toContain('kernel')
    expect(bluefinRegistryKeys).toContain('kernel')
  })

  it('every DAKOTA_KEYS entry in SectionPicker.vue resolves to a dakota registry field', () => {
    const sectionPickerSource = readFileSync(
      join(rootDir, 'src/components/sections/SectionPicker.vue'),
      'utf8',
    )
    const dakotaKeysMatch = sectionPickerSource.match(/const\s+DAKOTA_KEYS\s*=\s*\[([\s\S]*?)\]/)
    expect(dakotaKeysMatch, 'Could not find DAKOTA_KEYS in SectionPicker.vue').not.toBeNull()

    const dakotaKeys = dakotaKeysMatch![1]
      .split(',')
      .map(k => k.trim().replace(/['"]/g, ''))
      .filter(Boolean)

    expect(dakotaKeys.length).toBeGreaterThan(0)
    for (const key of dakotaKeys) {
      expect(
        dakotaRegistryKeys.has(key),
        `DAKOTA_KEYS entry "${key}" in SectionPicker.vue must resolve to a dakota package in IMAGE_SBOM_REGISTRY`,
      ).toBe(true)
    }
  })

  it('every PACKAGE_LABELS entry in SectionPicker.vue resolves to a dakota registry field', () => {
    const sectionPickerSource = readFileSync(
      join(rootDir, 'src/components/sections/SectionPicker.vue'),
      'utf8',
    )
    const packageLabelsMatch = sectionPickerSource.match(
      /const\s+PACKAGE_LABELS:\s*Record<string,\s*string>\s*=\s*\{([\s\S]*?)\n\}/,
    )
    expect(packageLabelsMatch, 'Could not find PACKAGE_LABELS in SectionPicker.vue').not.toBeNull()

    const packageLabelKeys = packageLabelsMatch![1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .map(line => line.split(':')[0].trim().replace(/['"]/g, ''))
      .filter(Boolean)

    expect(packageLabelKeys.length).toBeGreaterThan(0)
    for (const key of packageLabelKeys) {
      expect(
        dakotaRegistryKeys.has(key),
        `PACKAGE_LABELS entry "${key}" in SectionPicker.vue must resolve to a dakota package in IMAGE_SBOM_REGISTRY`,
      ).toBe(true)
    }
  })
})
