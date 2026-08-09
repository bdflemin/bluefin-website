import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CinematicTransition, {
  TRANSITION_LEAVE_MS,
  TRANSITION_MIN_HOLD_MS,
  transitionHoldMs,
} from '@/components/wolves/cinematic/CinematicTransition.vue'
import { CINEMATIC_SEGMENTS, PRE_END_THRESHOLD_S } from '@/config/wolves-cinematic'
import { useCinematicStore } from '@/stores/cinematic'

// These tests drive the store actions the player actually calls
// (`beginCrossfade()` at the start of a handoff, `advanceSegment()` when the
// fade lands) rather than assigning `segmentIndex` directly. Assigning the index
// is what let the overlay watch the wrong signal unnoticed: it only changes once
// the fade is already over, so the overlay covered the opening of the new song
// instead of the seam between the two.
describe('cinematicTransition overlay duration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function enterCinematicAt(index: number) {
    const store = useCinematicStore()
    store.phase = 'cinematic'
    store.showTransitionOverlay = true
    store.segmentIndex = index
    return store
  }

  it('raises the overlay when the crossfade starts, not after it lands', async () => {
    const store = enterCinematicAt(1)
    const wrapper = mount(CinematicTransition)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)

    // The handoff begins. The songs are still cross-fading and `segmentIndex`
    // still names the outgoing segment; the overlay must already be covering it.
    store.beginCrossfade(2)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(true)
    expect(store.segmentIndex).toBe(1)
  })

  it('stays up across the moment the segment lands', async () => {
    const store = enterCinematicAt(1)
    const wrapper = mount(CinematicTransition)

    store.beginCrossfade(2)
    await wrapper.vm.$nextTick()

    await vi.advanceTimersByTimeAsync(2500)
    store.advanceSegment()
    await wrapper.vm.$nextTick()
    // The fade has completed and `crossfading` has gone back to false. The
    // overlay must not flicker out with it.
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(true)
  })

  it('announces the incoming segment rather than the one that just ended', async () => {
    const store = enterCinematicAt(1)
    const wrapper = mount(CinematicTransition)

    store.beginCrossfade(2)
    await wrapper.vm.$nextTick()

    const incoming = store.segments[2]
    expect(wrapper.text()).toContain(incoming.title)
    expect(wrapper.text()).not.toContain(store.segments[1].title)
  })

  it('holds the overlay for the hold derived from the incoming crossfade', async () => {
    const store = enterCinematicAt(1)
    const wrapper = mount(CinematicTransition)

    store.beginCrossfade(2)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(true)

    // Derived from the same window the player ramps over, never a literal: a
    // hardcoded duration rots the moment an authored `crossfadeMs` changes.
    const hold = transitionHoldMs(store.crossfadeMsAt(2))
    await vi.advanceTimersByTimeAsync(hold - 100)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  // Regression for the defect where an opaque terminal card covered roughly the
  // first ten seconds of four of the six songs. The overlay is raised
  // `PRE_END_THRESHOLD_S + crossfadeMs` before the outgoing track ends, so the
  // new song starts that far into the hold; everything after that point is
  // overlay sitting on top of the incoming song.
  it.each([2, 3, 4, 5])('clears segment %i shortly after the audio ramp lands', async (target) => {
    const store = enterCinematicAt(target - 1)
    const wrapper = mount(CinematicTransition)

    store.beginCrossfade(target)
    await wrapper.vm.$nextTick()

    const crossfadeMs = store.crossfadeMsAt(target)
    const hold = transitionHoldMs(crossfadeMs)

    // The hold must outlast the ramp: the seam itself is never left uncovered.
    expect(hold).toBeGreaterThan(crossfadeMs)

    // ...and must not outlast it by much. The incoming song is already audible
    // `PRE_END_THRESHOLD_S` before the ramp completes, so everything from that
    // point until the leave transition finishes is card over new song. The
    // budget is one readable beat plus the fade out, derived from the constants
    // rather than pinned to a literal; the shipped defect measured ~10s here.
    const newSongStartsAt = crossfadeMs - PRE_END_THRESHOLD_S * 1000
    const overNewSong = hold - newSongStartsAt + TRANSITION_LEAVE_MS
    expect(overNewSong).toBeLessThanOrEqual(TRANSITION_MIN_HOLD_MS + TRANSITION_LEAVE_MS)

    await vi.advanceTimersByTimeAsync(hold)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  it('derives the hold from the incoming segment, not the outgoing one', async () => {
    // Derive the handoff to exercise instead of pinning it to authored part
    // numbers: pick the first adjacent pair whose authored crossfades produce
    // different holds. Short crossfades both clamp to TRANSITION_MIN_HOLD_MS,
    // so a pinned pair can silently stop distinguishing incoming from outgoing.
    const probe = useCinematicStore()
    const incoming = CINEMATIC_SEGMENTS.findIndex((_, index) => index > 0
      && transitionHoldMs(probe.crossfadeMsAt(index))
      !== transitionHoldMs(probe.crossfadeMsAt(index - 1)))
    expect(incoming).toBeGreaterThan(0)
    const outgoing = incoming - 1

    const store = enterCinematicAt(outgoing)
    const wrapper = mount(CinematicTransition)

    // The overlay must follow the segment it is announcing so it cannot drift
    // from the player's ramp.
    const outgoingHold = transitionHoldMs(store.crossfadeMsAt(outgoing))
    const incomingHold = transitionHoldMs(store.crossfadeMsAt(incoming))
    expect(incomingHold).toBeGreaterThan(outgoingHold)

    store.beginCrossfade(incoming)
    await wrapper.vm.$nextTick()

    await vi.advanceTimersByTimeAsync(outgoingHold)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(true)

    await vi.advanceTimersByTimeAsync(incomingHold - outgoingHold)
    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  it('never flashes the terminal block past the back row', () => {
    // Every authored crossfade, plus the default, must still yield one readable
    // beat of hold before the leave transition starts.
    for (const ms of [800, 1000, 1200, 1500, 2000, 2500]) {
      expect(transitionHoldMs(ms)).toBeGreaterThanOrEqual(TRANSITION_MIN_HOLD_MS)
    }
  })

  it('does not trigger the transition overlay if phase is not cinematic', async () => {
    const store = useCinematicStore()
    store.phase = 'intro'
    store.segmentIndex = 0

    const wrapper = mount(CinematicTransition)
    store.beginCrossfade(1)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  it('does not show a transition when returning to 7 Days to the Wolves', async () => {
    const store = enterCinematicAt(1)
    const wrapper = mount(CinematicTransition)

    store.beginCrossfade(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  it('skips the transition overlay for back-catalogue albums', async () => {
    const store = useCinematicStore()
    store.phase = 'cinematic'
    store.showTransitionOverlay = false
    store.segmentIndex = 0

    const wrapper = mount(CinematicTransition)
    store.beginCrossfade(2)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })

  it('does not show a title slide for the Ghosts In The Mist handoff', async () => {
    const store = enterCinematicAt(0)
    const wrapper = mount(CinematicTransition)

    // Segment 1 is ghosts-in-the-mist; its opening guardian plate must stay clear.
    store.beginCrossfade(1)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.wc-transition-overlay').exists()).toBe(false)
  })
})
