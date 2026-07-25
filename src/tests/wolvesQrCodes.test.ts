import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WolvesQrCodes from '../components/wolves/WolvesQrCodes.vue'

describe('wolvesQrCodes.vue', () => {
  it('renders the cast launcher card', () => {
    const wrapper = mount(WolvesQrCodes)

    // The store and donate QR cards moved into WolvesCharacterGallery.
    expect(wrapper.findAll('.qr-image-box img')).toHaveLength(0)
    expect(wrapper.find('google-cast-launcher.chromecast-btn').exists()).toBe(true)
  })
})
