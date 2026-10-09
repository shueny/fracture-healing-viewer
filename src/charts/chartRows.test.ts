import { describe, expect, it } from 'vitest'
import { getScenario } from '../data/scenarios'
import { METRICS, buildChartRows, weekFromChartClick } from './chartRows'

describe('chart rows', () => {
  const a = getScenario({ nailDiameterMm: 11, loading: 'partial' })
  const b = getScenario({ nailDiameterMm: 10, loading: 'full' })

  it('puts A and B values for each week side by side', () => {
    const rows = buildChartRows(a, b, 'consolidationPct')
    expect(rows).toHaveLength(21)
    expect(rows[8]).toEqual({
      week: 8,
      A: a.weeks[8].consolidationPct,
      B: b.weeks[8].consolidationPct,
    })
  })

  it('has the three PRD metrics with their units', () => {
    expect(METRICS.map((m) => [m.title, m.unit])).toEqual([
      ['碎片間移動', 'mm'],
      ['植入物應力', 'MPa'],
      ['癒合程度', '%'],
    ])
  })
})

describe('chart click', () => {
  it('turns the clicked point into a week', () => {
    expect(weekFromChartClick({ activeLabel: 8 })).toBe(8)
    expect(weekFromChartClick({ activeLabel: '12' })).toBe(12)
  })

  it('ignores clicks outside the data', () => {
    expect(weekFromChartClick({ activeLabel: undefined })).toBeNull()
    expect(weekFromChartClick({})).toBeNull()
  })
})
