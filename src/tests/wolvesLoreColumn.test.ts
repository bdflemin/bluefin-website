import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getChatlogLore, getQuoteLore, loreRecords } from '../components/wolves/lore'
import { splitReadableBeats } from '../components/wolves/lore/readable-beats'
import WolvesLoreColumn from '../components/wolves/WolvesLoreColumn.vue'
import { parseLoreRecord } from '../data/wolves-lore-records'
import { getNarrativeSlotForTime } from '../data/wolves-narrative-timeline'
import { wolvesRelease } from '../data/wolves-story'
import { getWolvesThesisState } from '../data/wolves-thesis-sequence'
import { wolvesLoreRecordFixtures } from './fixtures/wolves-lore-records'

async function advanceUntil(condition: () => boolean, timeoutMs = 60_000) {
  for (let elapsed = 0; elapsed < timeoutMs; elapsed += 250) {
    await vi.advanceTimersByTimeAsync(250)
    if (condition()) {
      return
    }
  }

  throw new Error(`Condition was not met within ${timeoutMs}ms`)
}

describe('wolvesLoreColumn Logic', () => {
  it('renders the narrative record in a unified surface without the removed dossier directory', () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'arthur-c-clarke-3',
        duration: 20,
      },
    })

    expect(wrapper.find('[data-unified-lore-feed]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('[ NARRATIVE FEED ]')
    expect(wrapper.text()).not.toContain('[ DOSSIER ARCHIVE ]')
    expect(wrapper.find('[data-lore-view-kind="quote"]').exists()).toBe(true)

    // The dossier directory (index, links, and return-to-current-record
    // navigation) has been removed entirely; only the timeline-selected
    // record surface remains.
    expect(wrapper.find('[data-dossier-directory]').exists()).toBe(false)
    expect(wrapper.find('[data-dossier-record-id]').exists()).toBe(false)
    expect(wrapper.find('[data-back-to-current-record]').exists()).toBe(false)
  })

  it('renders the artifact selected by the soundtrack timeline', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'arthur-c-clarke-3',
        duration: 20,
      },
    })

    await vi.advanceTimersByTimeAsync(5_000)
    expect(wrapper.find('[data-lore-view-kind="quote"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('It is a bitter thought, but you must face it.')
  })

  it.each([
    ['arthur-c-clarke-3', 'quote'],
    ['lorem-prologue-1', 'chatlog'],
  ])('renders %s as a record surface without the generic monitor console', (artifactId, kind) => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId,
        duration: 20,
      },
    })

    expect(wrapper.get(`[data-lore-view-kind="${kind}"]`).text()).not.toContain('nimbinatus@blue-universal:~$ monitor --archive')
    expect(wrapper.text()).not.toContain('// se7en.days')
  })

  it('types quote source characters without generated glyphs', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'arthur-c-clarke-3')
    if (!record || record.kind !== 'quote') {
      throw new Error('Expected a quote fixture')
    }
    const quote = getQuoteLore(record)

    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 1,
      },
    })

    vi.advanceTimersByTime(50)
    await wrapper.vm.$nextTick()

    const renderedQuote = wrapper.find('.lore-quote-text').text()
    expect(renderedQuote).not.toBe('')
    expect(quote.quote.startsWith(renderedQuote)).toBe(true)
  })

  it('renders an authored quote attribution over its title', () => {
    const record = loreRecords.find(record => record.id === 'arthur-c-clarke-2')
    if (!record || record.kind !== 'quote') {
      throw new Error('Expected the Arthur C. Clarke quote fixture')
    }
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 20,
      },
    })

    expect(record.diagnostics).toEqual([])
    expect(wrapper.get('.lore-quote-meta strong').text()).toBe('Arthur C. Clarke')
  })

  it.each(loreRecords.filter(record => record.kind === 'quote'))(
    'renders authored quote attribution and context for $id',
    (record) => {
      const wrapper = mount(WolvesLoreColumn, {
        props: {
          artifactId: record.id,
          duration: 20,
        },
      })

      expect(wrapper.get('.lore-quote-meta strong').text()).toBe(record.metadata.attribution)
      const context = wrapper.find('[data-lore-quote-context]')
      if (record.metadata.context) {
        expect(context.text()).toBe(record.metadata.context.trimEnd())
      }
      else {
        expect(context.exists()).toBe(false)
      }
    },
  )

  it('renders Arthur C. Clarke Childhood’s End quote identity without a trailing dash', () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'arthur-c-clarke-1',
        duration: 20,
      },
    })

    expect(wrapper.get('.lore-quote-meta strong').text()).toBe('Arthur C. Clarke')
    expect(wrapper.get('[data-lore-quote-context]').text()).toBe('Childhood\'s End')
  })

  it('rejects quote rendering without authored attribution instead of falling back to a legacy label', () => {
    const record = parseLoreRecord('quote-natasha-woods', 'prologue', './lore/quote-natasha-woods.md', [
      '---',
      'kind: quote',
      'title: Legacy source label',
      'timestamp: \'2326-07-14\'',
      '---',
      '',
      'Authored body',
    ].join('\n'))

    expect(() => getQuoteLore(record)).toThrow('missing authored attribution')
  })

  it('does not retain legacy source labels for migrated quote identity', () => {
    const quoteIds = new Set(loreRecords
      .filter(record => record.kind === 'quote')
      .map(record => record.id))
    const quoteArtifacts = wolvesRelease.artifacts.filter(artifact => quoteIds.has(artifact.id))

    expect(quoteArtifacts).toHaveLength(8)
    expect(quoteArtifacts.every(artifact => !Object.prototype.hasOwnProperty.call(artifact, 'sourceLabel'))).toBe(true)
  })

  it('types transmission source characters without generated glyphs', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'lorem-prologue-1')
    if (!record || record.kind !== 'chatlog') {
      throw new Error('Expected a transmission fixture')
    }
    const chatlog = getChatlogLore(record)

    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 0.01,
      },
    })

    vi.advanceTimersByTime(50)
    await wrapper.vm.$nextTick()

    const renderedMessage = wrapper.find('.conversation-message p').text()
    expect(renderedMessage).not.toBe('')
    expect(wrapper.find('[data-lore-view-kind="chatlog"]').exists()).toBe(true)
    expect(chatlog.messages[0].text.startsWith(renderedMessage)).toBe(true)
  })

  it('keeps chat typing at a readable pace in a short narrative slot', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'lorem-prologue-1')
    if (!record || record.kind !== 'chatlog') {
      throw new Error('Expected a chatlog fixture')
    }
    const chatlog = getChatlogLore(record)
    const firstMessage = chatlog.messages[0]
    if (!firstMessage) {
      throw new Error('Expected the chatlog fixture to contain a message')
    }

    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 0.01,
      },
    })

    await vi.advanceTimersByTimeAsync(50)

    expect(firstMessage.text.startsWith(wrapper.find('.conversation-message p').text())).toBe(true)
  })

  it('renders Jordan and Adrian as automatic readable beats without narrative controls', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'jordan-adrian')
    if (!record || record.kind !== 'chatlog') {
      throw new Error('Expected the Jordan and Adrian transmission fixture')
    }
    const chatlog = getChatlogLore(record)
    const expectedBeats = new Map(
      chatlog.messages
        .filter(message => message.speaker === 'Adrian' || message.speaker === 'Jordan')
        .map(message => [message.speaker!, splitReadableBeats(message.text, 120)]),
    )
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 0.01,
      },
    })
    const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const viewport = wrapper.get('.quote-viewport')
    const beforeClick = wrapper.text()

    expect(viewport.attributes('onClick')).toBeUndefined()
    await viewport.trigger('click')
    expect(wrapper.text()).toBe(beforeClick)

    const observedBeats = new Map<string, Map<string, string>>()
    await advanceUntil(() => {
      const beat = wrapper.find('.conversation-message')
      const speaker = beat.find('.conversation-speaker').text()
      const text = beat.find('p').exists() ? beat.find('p').text() : ''
      const expected = expectedBeats.get(speaker)
      if (!expected?.includes(text)) {
        return false
      }

      expect(wrapper.findAll('.conversation-message')).toHaveLength(1)
      expect(beat.find('.conversation-message-header').exists()).toBe(true)
      const speakerBeats = observedBeats.get(speaker) ?? new Map<string, string>()
      speakerBeats.set(text, beat.attributes('data-chatlog-beat-continuation') ?? 'false')
      observedBeats.set(speaker, speakerBeats)

      return [...expectedBeats].every(([name, beats]) => observedBeats.get(name)?.size === beats.length)
    })

    for (const [speaker, beats] of expectedBeats) {
      expect(observedBeats.get(speaker)?.size).toBe(beats.length)
      expect([...observedBeats.get(speaker)?.values() ?? []]).toEqual(
        beats.map((_, index) => String(index > 0)),
      )
    }
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('renders The Children sound effects with the established SFX treatment', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'lorem-prologue-2',
        duration: 0.01,
      },
    })

    const expectedEffects = [
      'static noise and distant explosions',
      'heavy static',
      'connection dropping',
    ]
    const observedEffects = new Set<string>()
    await advanceUntil(() => {
      const effect = wrapper.find('.sfx-message')
      if (!effect.exists()) {
        return false
      }

      const text = effect.find('.sfx-text').text()
      if (expectedEffects.includes(text)) {
        observedEffects.add(text)
      }
      expect(effect.find('.conversation-message-header').exists()).toBe(false)
      return observedEffects.size === expectedEffects.length
    })

    expect([...observedEffects]).toEqual(expectedEffects)
  })

  it('renders deterministic project tabs only for project-linked chats', async () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'openssf-reinforcements',
        duration: 20,
      },
    })

    expect(wrapper.findAll('[data-chatlog-project-tab]').map(button => button.text())).toEqual([
      '[ CHATLOG ]',
      '[ KUBESTELLAR ]',
      '[ KUBERNETES ]',
    ])

    await wrapper.get('[data-chatlog-project-tab="kubestellar"]').trigger('click')

    expect(wrapper.get('[data-chatlog-project-panel]').text()).toContain('KubeStellar')
    expect(wrapper.get('[data-chatlog-project-panel]').text()).toContain('CNCF Sandbox')
    expect(wrapper.get('[data-chatlog-project-panel]').text()).toContain('Continue using familiar Kubernetes APIs, tooling, and workflows.')
  })

  it('automatically pages long quotes without scroll or click controls', async () => {
    vi.useFakeTimers()
    const record = loreRecords
      .filter(record => record.kind === 'quote')
      .reduce((longest, record) => record.body.length > longest.body.length ? record : longest)
    if (record.kind !== 'quote') {
      throw new Error('Expected a quote fixture')
    }
    const beats = splitReadableBeats(record.body, 110)
    expect(beats.length).toBeGreaterThan(1)

    const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 0.01,
      },
    })
    const viewport = wrapper.get('.quote-viewport')
    const beforeClick = wrapper.get('.lore-quote-text').text()

    expect(viewport.attributes('onClick')).toBeUndefined()
    await viewport.trigger('click')
    expect(wrapper.get('.lore-quote-text').text()).toBe(beforeClick)

    await advanceUntil(() => Number(wrapper.get('.lore-quote-text').attributes('data-quote-beat-index')) > 0)

    expect(wrapper.get('.lore-quote-text').text()).not.toBe(record.body)
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('reveals the Golden Era vision and preserves Sarah pacing without narrative controls', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'lorem-pursuit-1')
    if (!record || record.kind !== 'chatlog') {
      throw new Error('Expected the Golden Era transmission fixture')
    }
    const chatlog = getChatlogLore(record)
    const saintclair = chatlog.messages.find(message => message.speaker === 'SAINTCLAIR')
    const climaxMessage = chatlog.messages.find(message => message.speaker === 'BUR//S')
    const sarah = chatlog.messages.find(message => message.speaker === 'SARAH')
    if (!saintclair || !climaxMessage || !sarah) {
      throw new Error('Expected the Golden Era conversation fixtures')
    }

    const vision = climaxMessage.text.slice(climaxMessage.text.indexOf('. ') + 2)
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 0.01,
      },
    })
    const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const viewport = wrapper.get('.quote-viewport')
    const beforeClick = wrapper.text()

    expect(viewport.attributes('onClick')).toBeUndefined()
    await viewport.trigger('click')
    expect(wrapper.text()).toBe(beforeClick)

    let sawSaintclair = false
    let sawVision = false
    let sawPartialSarah = false
    await advanceUntil(() => {
      const message = wrapper.find('.conversation-message')
      expect(wrapper.findAll('.conversation-message')).toHaveLength(1)
      const speaker = message.find('.conversation-speaker').text()
      const text = message.find('p').exists() ? message.find('p').text() : ''

      if (speaker === 'SAINTCLAIR' && text === saintclair.text) {
        sawSaintclair = true
      }
      if (speaker === 'BUR//S' && message.find('.climax-sentence').exists()) {
        expect(message.find('.climax-sentence').text()).toBe(vision)
        sawVision = true
      }
      if (speaker === 'SARAH' && text && text !== sarah.text) {
        sawPartialSarah = true
      }

      return sawSaintclair && sawVision && sawPartialSarah
    }, 120_000)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('keeps the finale chat noninteractive after its key line is revealed', async () => {
    vi.useFakeTimers()
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'committee-report-personal-transmission',
        duration: 0.01,
      },
    })
    const scrollTo = vi.spyOn(HTMLElement.prototype, 'scrollTo')
    const viewport = wrapper.get('.quote-viewport')
    const beforeClick = wrapper.text()

    expect(viewport.attributes('onClick')).toBeUndefined()
    await viewport.trigger('click')
    expect(wrapper.text()).toBe(beforeClick)
    await vi.advanceTimersByTimeAsync(20_000)

    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('holds a completed conversation for five seconds before its slot ends', async () => {
    vi.useFakeTimers()
    const record = loreRecords.find(record => record.id === 'lorem-prologue-1')
    if (!record || record.kind !== 'chatlog') {
      throw new Error('Expected a chatlog fixture')
    }
    const chatlog = getChatlogLore(record)
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: record.id,
        duration: 30,
      },
    })

    const finalMessage = chatlog.messages[chatlog.messages.length - 1]!
    await advanceUntil(() => {
      const message = wrapper.find('.conversation-message')
      return message.find('.conversation-speaker').text() === finalMessage.speaker
        && message.find('p').exists()
        && message.find('p').text() === finalMessage.text
    })

    expect(wrapper.emitted('chat-complete')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(4_000)
    expect(wrapper.emitted('chat-complete')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1_500)
    expect(wrapper.emitted('chat-complete')).toHaveLength(1)
  })

  it('replaces the full lore column with a vertical dinosaur dossier', () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'dinosaur-subject',
        duration: 20,
        records: wolvesLoreRecordFixtures,
      },
    })

    expect(wrapper.find('[data-lore-view="dinosaur-dossier"]').exists()).toBe(true)
    expect(wrapper.get('[data-species-artwork]').attributes('src')).toContain('characters/achillobator.webp')
    expect(wrapper.text()).toContain('bond: guardian-dinosaur')
    // Bond identity renders exactly once: as the spec-list cross-reference.
    expect(wrapper.text()).not.toContain('GUARDIANBOND /')
    expect(wrapper.text()).not.toContain('BONDED RIDER /')
    expect(wrapper.find('.mascot-console-hud').exists()).toBe(false)
  })

  it('renders canonical source provenance independently of authored body text', () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'ishtar-gardener-and-winnower',
        duration: 20,
      },
    })

    expect(wrapper.text()).toContain('provenance: https://www.ishtar-collective.net/entries/gardener-and-winnower')
  })

  it.each([405, 425])('renders the thesis warning beside the final news artifact at Track 0 %is', (time) => {
    const thesisState = getWolvesThesisState(time)
    const finalSlot = getNarrativeSlotForTime(time)
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: finalSlot.artifactId,
        duration: finalSlot.endTime - finalSlot.startTime,
        warning: thesisState.warning,
      },
    })

    expect(finalSlot).toMatchObject({
      artifactId: 'blue-universal-acquires-wayland-yutani',
      startTime: 398,
      endTime: 425,
    })
    expect(thesisState.warning).toBe('truly a great loss for humanity.')
    expect(wrapper.find('[data-lore-view="news-bulletin"]').exists()).toBe(true)
    expect(wrapper.get('[data-lore-warning]').classes()).toContain('thesis-warning-fade')
    expect(wrapper.get('[data-lore-warning]').text()).toBe(thesisState.warning)
    if (thesisState.text) {
      expect(wrapper.text()).not.toContain(thesisState.text)
    }
  })

  it.each([
    ['news-record', 'news-bulletin'],
    ['source-record', 'source-fragment'],
    ['field-report-record', 'field-report'],
    ['location-record', 'location-dossier'],
    ['guardian-subject', 'guardian-dossier'],
    ['guardian-dinosaur', 'guardian-bond'],
  ])('routes %s to its dedicated full-column view', (artifactId, view) => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId,
        duration: 20,
        records: wolvesLoreRecordFixtures,
      },
    })

    expect(wrapper.find(`[data-lore-view="${view}"]`).exists()).toBe(true)
  })

  it('renders authored Guardian dossier fields with derived telemetry', () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'guardian-subject',
        duration: 20,
        records: wolvesLoreRecordFixtures,
      },
    })

    expect(wrapper.text()).toContain('MAINTAINER // GUARDIAN')
    expect(wrapper.text()).toContain('CONTROLLER · RECONCILER')
    expect(wrapper.text()).toContain('class: titan')
    expect(wrapper.text()).toContain('super: Test super')
    expect(wrapper.text()).toContain('GuardianBond: guardian-dinosaur')
    expect(wrapper.text()).toContain('fnv1a:')
  })

  it('keeps the timeline-selected record current with no dossier navigation available', async () => {
    const wrapper = mount(WolvesLoreColumn, {
      props: {
        artifactId: 'arthur-c-clarke-3',
        duration: 20,
      },
    })

    // Selected record is the timeline-driven artifact (a quote), and there is
    // no dossier index or return-to-current-record control to navigate away
    // from it.
    expect(wrapper.find('[data-lore-view-kind="quote"]').exists()).toBe(true)
    expect(wrapper.find('[data-dossier-directory]').exists()).toBe(false)
    expect(wrapper.find('[data-dossier-record-id]').exists()).toBe(false)
    expect(wrapper.find('[data-back-to-current-record]').exists()).toBe(false)

    await wrapper.setProps({ artifactId: 'lorem-prologue-1' })
    await wrapper.vm.$nextTick()

    // Advancing the timeline-selected artifact still routes to its own view,
    // with the dossier navigation staying absent.
    expect(wrapper.find('[data-lore-view-kind="chatlog"]').exists()).toBe(true)
    expect(wrapper.find('[data-back-to-current-record]').exists()).toBe(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
})
