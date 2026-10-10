import { beforeEach, describe, expect, it } from 'vitest'
import { useViewerStore } from './useViewerStore'

const get = () => useViewerStore.getState()

describe('viewer store: timeline', () => {
  beforeEach(() => useViewerStore.setState({ week: 0, playing: false }))

  it('play advances with tick and stops at week 20', () => {
    get().togglePlay()
    get().tick(5)
    expect(get().week).toBeCloseTo(10)
    expect(get().playing).toBe(true)
    get().tick(60)
    expect(get().week).toBe(20)
    expect(get().playing).toBe(false)
  })

  it('pressing play at the end restarts from week 0', () => {
    useViewerStore.setState({ week: 20 })
    get().togglePlay()
    expect(get().week).toBe(0)
    expect(get().playing).toBe(true)
  })

  it('setting or stepping the week pauses playback and clamps', () => {
    useViewerStore.setState({ playing: true })
    get().setWeek(25)
    expect(get()).toMatchObject({ week: 20, playing: false })
    useViewerStore.setState({ playing: true, week: 3.5 })
    get().step(1)
    expect(get()).toMatchObject({ week: 4, playing: false })
  })
})
