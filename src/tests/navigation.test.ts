import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref } from 'vue'
import Navigation from '../components/Navigation.vue'
import { i18n } from '../locales/schema'

const section = ref('null')
const visibleSection = computed(() => section.value)

function mountNavigation() {
  return mount(Navigation, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      provide: { visibleSection },
    },
  })
}

describe('navigation.vue', () => {
  beforeEach(() => {
    section.value = 'null'
    Element.prototype.scrollIntoView = vi.fn()
    window.scrollTo = vi.fn()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders one translated link per section', () => {
    const wrapper = mountNavigation()

    const links = wrapper.findAll('nav ul li a')
    expect(links).toHaveLength(5)
    expect(links.map(link => link.attributes('href'))).toEqual([
      '#scene-users',
      '#scene-developers',
      '#scene-mission',
      '#scene-picker',
      '#scene-community',
    ])
    expect(links.map(link => link.text())).toEqual([
      'For You',
      'For Devs',
      'Our Mission',
      'Try Out',
      'Community',
    ])
    wrapper.unmount()
  })

  it('marks the injected visible section as active', async () => {
    const wrapper = mountNavigation()

    expect(wrapper.find('a.active').exists()).toBe(false)
    expect(wrapper.get('.bg').attributes('style')).toContain('opacity: 0')

    section.value = '#scene-mission'
    await nextTick()

    expect(wrapper.get('a[href="#scene-mission"]').classes()).toContain('active')
    expect(wrapper.get('.bg').attributes('style')).toContain('opacity: 1')
    wrapper.unmount()
  })

  it('scrolls to the target section when a link is clicked', async () => {
    const target = document.createElement('div')
    target.id = 'scene-users'
    document.body.appendChild(target)

    const wrapper = mountNavigation()
    await wrapper.get('a[href="#scene-users"]').trigger('click')

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    wrapper.unmount()
  })

  it('reveals the scroll-up button near the page bottom and scrolls to top on click', async () => {
    const wrapper = mountNavigation()

    expect(wrapper.find('button.btn-up').exists()).toBe(false)

    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const buttonUp = wrapper.get('button.btn-up')
    await buttonUp.trigger('click')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    wrapper.unmount()
  })
})
