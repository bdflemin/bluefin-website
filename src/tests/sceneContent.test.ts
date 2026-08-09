import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SceneContent from '../components/common/SceneContent.vue'
import { i18n } from '../locales/schema'

function mountSceneContent(props: Record<string, unknown> = {}) {
  return mount(SceneContent, {
    props: {
      tag: 'Users.Tag',
      title: 'Users.Title',
      text: 'Users.Intro',
      ...props,
    },
    global: {
      plugins: [i18n],
    },
  })
}

describe('sceneContent.vue', () => {
  it('renders the translated tag, title, and markdown text', () => {
    const wrapper = mountSceneContent({ disableAnimation: true })

    expect(wrapper.get('strong').text()).toBe('For')
    expect(wrapper.get('h2').text()).toBe('You')
    expect(wrapper.get('p').text()).toContain('Bluefin is an operating system')
  })

  it('is marked visible immediately when the animation is disabled', () => {
    const wrapper = mountSceneContent({ disableAnimation: true })
    expect(wrapper.get('.scene-content').classes()).toContain('visible')
  })

  it('stays hidden until scrolled into view by default', () => {
    const wrapper = mountSceneContent()
    expect(wrapper.get('.scene-content').classes()).not.toContain('visible')
  })
})
