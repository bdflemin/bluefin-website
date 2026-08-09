import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SectionFooter from '../components/sections/SectionFooter.vue'
import { LangAlumniCompanies, LangPoweredBy, LangSponsors } from '../content'
import { i18n } from '../locales/schema'

function mountFooter() {
  return mount(SectionFooter, {
    global: {
      plugins: [i18n],
    },
  })
}

describe('sectionFooter.vue', () => {
  it('renders every alumni, sponsor, and powered-by logo from the content registry', () => {
    const wrapper = mountFooter()

    expect(wrapper.findAll('.alumni-logos img')).toHaveLength(LangAlumniCompanies.length)
    expect(wrapper.findAll('.sponsor-logos img')).toHaveLength(LangSponsors.length)
    expect(wrapper.get('.footer-title').text()).toBe('Powered By')
    expect(wrapper.findAll('footer > .container .logo-list img').length)
      .toBeGreaterThanOrEqual(LangPoweredBy.length)
  })

  it('wraps brands with a project URL in a new-tab link and leaves the rest as plain images', () => {
    const wrapper = mountFooter()

    const alumniWithUrls = LangAlumniCompanies.filter(brand => brand.projectUrl)
    const linked = wrapper.findAll('.alumni-logos a')
    expect(linked).toHaveLength(alumniWithUrls.length)
    for (const link of linked) {
      expect(link.attributes('target')).toBe('_blank')
    }

    const linkedHrefs = linked.map(link => link.attributes('href'))
    expect(linkedHrefs).toEqual(alumniWithUrls.map(brand => brand.projectUrl))
  })
})
