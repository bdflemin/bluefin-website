import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import qrStore from '@/assets/svg/qr-store.svg'
import CinematicLobby from '@/components/wolves/cinematic/CinematicLobby.vue'

describe('cinematicLobby.vue', () => {
  it('keeps the store QR CTA visible and focusable before entering the cinematic', async () => {
    const wrapper = mount(CinematicLobby, { attachTo: document.body })

    try {
      const storeLink = wrapper.get('a[href="https://store.projectbluefin.io"]')
      const storeQr = wrapper.get('img[alt="QR code for the Project Bluefin store"]')
      const enterButton = wrapper.get('button[type="button"]')

      expect(storeQr.attributes('src')).toBe(qrStore)
      expect(storeLink.attributes('target')).toBe('_blank')
      expect(storeLink.element.compareDocumentPosition(enterButton.element)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)

      ;(storeLink.element as HTMLAnchorElement).focus()
      expect(document.activeElement).toBe(storeLink.element)

      await enterButton.trigger('click')
      expect(wrapper.emitted('enter')).toEqual([[]])
    }
    finally {
      wrapper.unmount()
    }
  })
})
