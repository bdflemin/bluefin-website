import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RssFeed from '../components/RssFeed.vue'
import { i18n } from '../locales/schema'

const FEED_URL = 'https://docs.projectbluefin.io/atom.xml'

const ATOM_XML = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Bluefin Blog</title>
  <entry>
    <title>Post One</title>
    <link href="https://docs.projectbluefin.io/blog/post-one"/>
    <published>2024-02-01T10:00:00Z</published>
    <summary>First post summary</summary>
  </entry>
  <entry>
    <title>Post Two</title>
    <link href="https://docs.projectbluefin.io/blog/post-two"/>
    <published>2024-02-08T10:00:00Z</published>
    <summary>Second post summary</summary>
  </entry>
  <entry>
    <title>Post Three</title>
    <link href="https://docs.projectbluefin.io/blog/post-three"/>
    <published>2024-02-15T10:00:00Z</published>
    <summary>Third post summary</summary>
  </entry>
</feed>`

function mountFeed(props: { feedUrl: string, perPage?: number }) {
  return mount(RssFeed, {
    props,
    global: {
      plugins: [i18n],
    },
  })
}

describe('rssFeed.vue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders posts from the live feed, limited by perPage', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => ATOM_XML,
    })))

    const wrapper = mount(RssFeed, {
      props: { feedUrl: FEED_URL, perPage: 2 },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    const posts = wrapper.findAll('article.blog-post')
    expect(posts).toHaveLength(2)
    expect(posts[0].get('.post-title a').text()).toBe('Post One')
    expect(posts[0].get('.post-title a').attributes('href'))
      .toBe('https://docs.projectbluefin.io/blog/post-one')
    expect(posts[0].get('.post-date').text()).toBe('February 1, 2024')

    const viewAll = wrapper.get('.feed-source a')
    expect(viewAll.attributes('href')).toBe('https://docs.projectbluefin.io')
  })

  it('falls back to bundled posts when the live feed is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }))

    const wrapper = mountFeed({ feedUrl: FEED_URL })
    await flushPromises()

    const posts = wrapper.findAll('article.blog-post')
    expect(posts).toHaveLength(3)
    expect(posts[0].get('.post-title a').text()).toBe('Introducing Project Bluefin')
  })

  it('applies perPage to the fallback posts as well', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })))

    const wrapper = mountFeed({ feedUrl: FEED_URL, perPage: 1 })
    await flushPromises()

    expect(wrapper.findAll('article.blog-post')).toHaveLength(1)
  })
})
