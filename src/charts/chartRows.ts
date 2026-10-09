import type { Metric } from '../data/scenarios'
import type { Scenario } from '../data/generateScenarios'

export interface ChartRow {
  week: number
  A: number
  B: number
}

// One row per week with both scenarios' values side by side: the shape
// Recharts wants for two lines on one x axis.
export function buildChartRows(a: Scenario, b: Scenario, metric: Metric): ChartRow[] {
  return a.weeks.map((w, i) => ({ week: w.week, A: w[metric], B: b.weeks[i][metric] }))
}

export interface MetricInfo {
  metric: Metric
  title: string
  unit: string
  digits: number // decimals shown in the tooltip
}

// The three PRD charts (F5), in layout order.
export const METRICS: MetricInfo[] = [
  { metric: 'ifmMm', title: '碎片間移動', unit: 'mm', digits: 2 },
  { metric: 'implantStressMpa', title: '植入物應力', unit: 'MPa', digits: 0 },
  { metric: 'consolidationPct', title: '癒合程度', unit: '%', digits: 0 },
]

// Chart click -> week to jump to. Recharts reports the week under the
// pointer (the nearest data point) as `activeLabel`; null if outside data.
export function weekFromChartClick(state: { activeLabel?: string | number }): number | null {
  const week = Number(state.activeLabel)
  return state.activeLabel === undefined || Number.isNaN(week) ? null : week
}
