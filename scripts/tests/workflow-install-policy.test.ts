import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { load } from 'js-yaml'
import { describe, expect, it } from 'vitest'

const WORKFLOWS_DIR = resolve(process.cwd(), '.github/workflows')

describe('workflow dependency installation policy', () => {
  const privilegedWorkflows = [
    'deploy.yml',
    'preview.yml',
    'update-content.yml',
  ]

  for (const file of privilegedWorkflows) {
    it(`${file} installs dependencies with npm ci`, () => {
      const workflow = load(readFileSync(join(WORKFLOWS_DIR, file), 'utf8')) as {
        jobs?: Record<string, { steps?: { name?: string, run?: string }[] }>
      }
      let foundInstall = false
      for (const job of Object.values(workflow.jobs ?? {})) {
        for (const step of job.steps ?? []) {
          if (step.name === 'Install dependencies') {
            foundInstall = true
            expect(
              step.run,
              `${file} step "${step.name}" must use "npm ci" instead of "npm install"`,
            ).toBe('npm ci')
          }
        }
      }
      expect(foundInstall, `${file} should have an "Install dependencies" step`).toBe(true)
    })
  }
})
