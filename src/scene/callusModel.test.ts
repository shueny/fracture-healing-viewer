import { describe, expect, it } from 'vitest'
import { consolidationPct, type ScenarioParams } from '../data/healingModel'
import { TISSUES, callusGrowth, callusMaturity, callusRemodel, tissueIndex } from './callusModel'

describe('callus size over time (owner: grow, then remodel)', () => {
  it('is absent at week 0 and full size by 50 % consolidation', () => {
    expect(callusGrowth(0)).toBe(0)
    expect(callusGrowth(0.5)).toBe(1)
    expect(callusGrowth(0.25)).toBeCloseTo(0.5)
  })

  it('shrinks the outer bulge by up to 35 % only near the end', () => {
    expect(callusRemodel(0.6)).toBe(1)
    expect(callusRemodel(1)).toBeCloseTo(0.65)
  })
})

describe('tissue state (owner: outer parts ossify first)', () => {
  it('everything is fibrous at the start', () => {
    for (const d of [0, 0.5, 1]) expect(tissueIndex(callusMaturity(0, d))).toBe(0)
  })

  it('the callus end matures before the fracture line', () => {
    for (const c of [0.3, 0.5, 0.7]) {
      expect(callusMaturity(c, 1)).toBeGreaterThan(callusMaturity(c, 0))
    }
  })

  it('full consolidation gives mature bone everywhere', () => {
    for (const d of [0, 0.5, 1])
      expect(TISSUES[tissueIndex(callusMaturity(1, d))].key).toBe('mature')
  })

  it('the fracture line turns mature later in the delayed scenario', () => {
    // First whole week at which the fracture line (d = 0) is mature bone.
    const bridgingWeek = (p: ScenarioParams) => {
      for (let w = 0; w <= 20; w++) {
        const c = consolidationPct(p, w) / 100
        if (TISSUES[tissueIndex(callusMaturity(c, 0))].key === 'mature') return w
      }
      return Infinity
    }
    expect(bridgingWeek({ nailDiameterMm: 11, loading: 'partial' })).toBe(10)
    expect(bridgingWeek({ nailDiameterMm: 10, loading: 'full' })).toBe(15)
  })

  it('maps maturity to the four legend categories in order', () => {
    expect([0.1, 0.3, 0.6, 0.9].map(tissueIndex)).toEqual([0, 1, 2, 3])
  })
})
