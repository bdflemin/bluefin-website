import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CinematicLobby from '@/components/wolves/cinematic/CinematicLobby.vue'

describe('cinematicLobby.vue', () => {
  it('renders Meet Your Teammates as the filled primary entry CTA', async () => {
    const wrapper = mount(CinematicLobby, { attachTo: document.body })

    try {
      const enterButton = wrapper.get('.wc-lobby-enter')

      expect(enterButton.classes()).toContain('wc-cta--primary')
      expect(enterButton.get('.wc-cta-icon').attributes('aria-hidden')).toBe('true')
      expect(wrapper.get('.wc-cta-instruction').text()).toBe('Click to begin the Wolves Experience')
      expect(enterButton.text()).toContain('Meet your Teammates')

      await enterButton.trigger('click')
      expect(wrapper.emitted('enter')).toEqual([[]])
    }
    finally {
      wrapper.unmount()
    }
  })

  it('keeps funding and nomination controls unavailable in the draft', () => {
    const wrapper = mount(CinematicLobby, { attachTo: document.body })

    try {
      expect(wrapper.findAll('img[alt*="QR code"]')).toHaveLength(0)
      expect(wrapper.findAll('a.wc-character-card-donate')).toHaveLength(0)
      expect(wrapper.get('.wc-character-card--nominate').text()).toContain('NOMINATE A MAINTAINER')
      expect(wrapper.findAll('button.wc-character-card-donate:disabled').length).toBeGreaterThan(0)
    }
    finally {
      wrapper.unmount()
    }
  })
})
