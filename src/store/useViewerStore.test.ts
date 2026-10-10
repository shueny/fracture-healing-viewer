import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SCENARIOS, useViewerStore } from './useViewerStore'

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

describe('viewer store: scenarios', () => {
  beforeEach(() =>
    useViewerStore.setState({ scenarios: DEFAULT_SCENARIOS, week: 8, playing: false }),
  )

  it('starts with the owner defaults: A = 11 mm partial, B = 10 mm full', () => {
    expect(get().scenarios).toEqual({
      A: { nailDiameterMm: 11, loading: 'partial' },
      B: { nailDiameterMm: 10, loading: 'full' },
    })
  })

  it('changes one parameter of one view only, keeping the week', () => {
    get().setScenario('A', { loading: 'full' })
    expect(get().scenarios.A).toEqual({ nailDiameterMm: 11, loading: 'full' })
    expect(get().scenarios.B).toEqual(DEFAULT_SCENARIOS.B)
    expect(get().week).toBe(8)
  })
})
