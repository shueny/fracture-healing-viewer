import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WEEKS, buildScenarios } from './generateScenarios'
import { consolidationPct } from './healingModel'
import { SCENARIO_FILE, getScenario, valueAt } from './scenarios'

describe('generateScenarios', () => {
  const file = buildScenarios()

  it('builds 4 scenarios (2 diameters x 2 loadings), each with weeks 0..20', () => {
    expect(file.scenarios.map((s) => s.id).sort()).toEqual([
      'nail10-full',
      'nail10-partial',
      'nail11-full',
      'nail11-partial',
    ])
    for (const s of file.scenarios) {
      expect(s.weeks.map((w) => w.week)).toEqual(Array.from({ length: WEEKS + 1 }, (_, i) => i))
    }
  })

  it('matches the PRD JSON example for week 0 of nail10-partial', () => {
    expect(file.case).toEqual({ bone: 'femur', fractureGapMm: 3, fixation: 'intramedullary nail' })
    expect(file.scenarios.find((s) => s.id === 'nail10-partial')!.weeks[0]).toEqual({
      week: 0,
      ifmMm: 0.8,
      implantStressMpa: 220,
      consolidationPct: 0,
    })
  })

  it('the committed scenarios.json is up to date with the formulas', () => {
    const committed = JSON.parse(
      readFileSync(resolve(import.meta.dirname, 'scenarios.json'), 'utf8'),
    )
    expect(committed).toEqual(file)
  })
})

describe('reading scenarios', () => {
  const p = { nailDiameterMm: 10, loading: 'full' } as const

  it('finds a scenario by its parameters', () => {
    expect(getScenario(p).id).toBe('nail10-full')
    expect(SCENARIO_FILE.scenarios).toHaveLength(4)
  })

  it('returns stored values at whole weeks and interpolates in between', () => {
    const s = getScenario(p)
    expect(valueAt(s, 'consolidationPct', 8)).toBe(s.weeks[8].consolidationPct)
    const mid = (s.weeks[8].consolidationPct + s.weeks[9].consolidationPct) / 2
    expect(valueAt(s, 'consolidationPct', 8.5)).toBeCloseTo(mid)
    expect(valueAt(s, 'consolidationPct', 8.5)).toBeCloseTo(consolidationPct(p, 8.5), 0)
  })

  it('clamps to week 0 and week 20', () => {
    const s = getScenario(p)
    expect(valueAt(s, 'ifmMm', -1)).toBe(s.weeks[0].ifmMm)
    expect(valueAt(s, 'ifmMm', 20)).toBe(s.weeks[20].ifmMm)
    expect(valueAt(s, 'ifmMm', 25)).toBe(s.weeks[20].ifmMm)
  })
})
