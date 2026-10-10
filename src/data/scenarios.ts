// Reads the precomputed scenarios.json. The app never runs the formulas
// itself: like a real product, it only presents simulation results.
import type { Loading, NailDiameterMm, ScenarioParams } from './healingModel.ts'
import {
  scenarioId,
  type Scenario,
  type ScenarioFile,
  type WeekValues,
} from './generateScenarios.ts'
import data from './scenarios.json'

export const SCENARIO_FILE = data as ScenarioFile

export type Metric = Exclude<keyof WeekValues, 'week'>

export function getScenario(p: ScenarioParams): Scenario {
  const id = scenarioId(p.nailDiameterMm as NailDiameterMm, p.loading as Loading)
  const scenario = SCENARIO_FILE.scenarios.find((s) => s.id === id)
  if (!scenario) throw new Error(`Unknown scenario ${id}`)
  return scenario
}

// Linear interpolation between whole weeks, for smooth playback (ADR 0011).
export function valueAt(scenario: Scenario, metric: Metric, week: number): number {
  const last = scenario.weeks.length - 1
  const w = Math.min(last, Math.max(0, week))
  const i = Math.min(last - 1, Math.floor(w))
  const t = w - i
  const a = scenario.weeks[i][metric]
  const b = scenario.weeks[i + 1][metric]
  return a + (b - a) * t
}
