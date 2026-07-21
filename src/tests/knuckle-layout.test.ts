import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const src = readFileSync(resolve(process.cwd(), 'src/KnuckleApp.vue'), 'utf8')

const templateMatch = src.match(/<template>([\s\S]*?)<\/template>/)
const template = templateMatch?.[1] ?? ''

const styleMatch = src.match(/<style[^>]*>([\s\S]*?)<\/style>/)
const style = styleMatch?.[1] ?? ''

describe('knuckleApp layout — single-column centered layout with server dinosaurs bookending the page', () => {
  it('col-left-stack is the main column container', () => {
    expect(template).toContain('col-left-stack')
  })

  it('col-left contains KnuckleTitle and KnuckleDesc', () => {
    const leftBlock = template.slice(template.indexOf('col-left'))
    expect(leftBlock).toContain('KnuckleTitle')
    expect(leftBlock).toContain('KnuckleDesc')
  })

  it('col-demos contains KnuckleDemos', () => {
    const demosBlock = template.slice(template.indexOf('col-demos'))
    expect(demosBlock).toContain('KnuckleDemos')
  })

  it('knuckleVersionChips is inside col-left-stack', () => {
    const stackBlock = template.slice(template.indexOf('col-left-stack'))
    expect(stackBlock).toContain('KnuckleVersionChips')
  })

  it('knuckle-layout uses flex-direction: column on desktop', () => {
    expect(style).toContain('flex-direction: column')
  })

  it('knuckle-layout centers content with align-items: center', () => {
    const layoutBlock = style.slice(style.indexOf('.knuckle-layout'))
    expect(layoutBlock).toContain('align-items: center')
  })

  it('adds Alamo opposite Karl in the page artwork', () => {
    expect(template).toContain('class="alamo"')
    expect(template).toContain('characters/alamosaurus.webp')
    expect(style).toContain('.alamo')
    expect(style).toContain('left: 0')
  })

  it('karl uses position: fixed so it stays on the right side while scrolling', () => {
    const karlBlock = style.slice(style.indexOf('.karl'))
    expect(karlBlock).toContain('position: fixed')
  })

  it('karl uses bottom: -10px to anchor to the bottom of the viewport', () => {
    const karlBlock = style.slice(style.indexOf('.karl'))
    expect(karlBlock).toContain('bottom: -10px')
  })
})
