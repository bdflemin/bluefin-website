import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PageLoading from '../components/PageLoading.vue'

describe('pageLoading.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('cycles the ellipsis from one to five dots and wraps around', async () => {
    const wrapper = mount(PageLoading)

    const dots = () => wrapper.findAll('span')[1].text()
    expect(dots()).toBe('.')

    await vi.advanceTimersByTimeAsync(500)
    expect(dots()).toBe('..')

    await vi.advanceTimersByTimeAsync(1500)
    expect(dots()).toBe('.....')

    await vi.advanceTimersByTimeAsync(500)
    expect(dots()).toBe('.')

    wrapper.unmount()
  })

  it('stops the interval after unmount', async () => {
    const wrapper = mount(PageLoading)
    wrapper.unmount()

    // Advancing timers after unmount must not throw or keep updating.
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.exists()).toBe(false)
  })
})
