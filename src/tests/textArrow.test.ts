import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TextArrow from '../components/common/TextArrow.vue'

describe('textArrow.vue', () => {
  it('renders the arrow icon and the text prop', () => {
    const wrapper = mount(TextArrow, {
      props: {
        left: false,
        right: false,
        top: false,
        bottom: false,
        deg: 0,
        text: true,
      },
    })

    // Vite inlines the small arrow SVG as a data URI in the test build.
    expect(wrapper.get('.arrow img').attributes('src')).toMatch(/^data:image\/svg\+xml/)
    expect(wrapper.get('.arrow span').text()).toBe('true')
  })
})
