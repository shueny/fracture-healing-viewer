import { describe, expect, it } from 'vitest'
import {
  consolidationPct,
  ifmMm,
  implantStressMpa,
  initialIfmMm,
  isDelayed,
  timeConstants,
  type ScenarioParams,
} from './healingModel'

const s = (nailDiameterMm: 10 | 11, loading: 'partial' | 'full'): ScenarioParams => ({
  nailDiameterMm,
  loading,
})

describe('healing model (PRD formulas)', () => {
  it('initial IFM matches the PRD table and only 10 mm + full is delayed (ADR 0001)', () => {
    const table: [ScenarioParams, number, boolean][] = [
      [s(10, 'partial'), 0.8, false],
      [s(11, 'partial'), 0.64, false],
      [s(10, 'full'), 1.28, true],
      [s(11, 'full'), 1.024, false],
    ]
    for (const [p, ifm0, delayed] of table) {
      expect(initialIfmMm(p)).toBeCloseTo(ifm0)
      expect(isDelayed(p)).toBe(delayed)
    }
  })

  it('uses tau 6 / tauC 8 when delayed, otherwise 4 / 5', () => {
    expect(timeConstants(s(10, 'full'))).toEqual({ tau: 6, tauC: 8 })
    expect(timeConstants(s(11, 'partial'))).toEqual({ tau: 4, tauC: 5 })
  })

  it('starts at the PRD week-0 values for the reference scenario', () => {
    const p = s(10, 'partial')
    expect(ifmMm(p, 0)).toBeCloseTo(0.8)
    expect(implantStressMpa(p, 0)).toBeCloseTo(220)
    expect(consolidationPct(p, 0)).toBe(0)
  })

  it('follows the exponential formulas at a later week', () => {
    const p = s(10, 'full') // delayed: tau 6, tauC 8, ratio 1.6
    const c = 100 * (1 - Math.exp(-8 / 8))
    expect(consolidationPct(p, 8)).toBeCloseTo(c)
    expect(ifmMm(p, 6)).toBeCloseTo(1.28 * Math.exp(-1))
    expect(implantStressMpa(p, 8)).toBeCloseTo(220 * 1.6 * (1 - 0.7 * (c / 100)))
  })

  it('a delayed scenario consolidates more slowly', () => {
    expect(consolidationPct(s(10, 'full'), 10)).toBeLessThan(consolidationPct(s(11, 'partial'), 10))
  })
})
