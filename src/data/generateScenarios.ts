// Builds the content of scenarios.json from the PRD formulas: 4 scenarios
// (2 nail diameters x 2 loadings) x 21 weeks. Run at build time by
// scripts/writeScenarios.ts; the app only reads the JSON (PRD: precomputed).

import {
  LOADINGS,
  NAIL_DIAMETERS_MM,
  consolidationPct,
  ifmMm,
  implantStressMpa,
  type Loading,
  type NailDiameterMm,
} from './healingModel.ts'

export const WEEKS = 20

export interface WeekValues {
  week: number
  ifmMm: number
  implantStressMpa: number
  consolidationPct: number
}

export interface Scenario {
  id: string
  nailDiameterMm: NailDiameterMm
  loading: Loading
  weeks: WeekValues[]
}

export interface ScenarioFile {
  case: { bone: string; fractureGapMm: number; fixation: string }
  scenarios: Scenario[]
}

export const scenarioId = (nailDiameterMm: NailDiameterMm, loading: Loading) =>
  `nail${nailDiameterMm}-${loading}`

const round = (x: number, digits: number) => Number(x.toFixed(digits))

export function buildScenarios(): ScenarioFile {
  const scenarios: Scenario[] = []
  for (const nailDiameterMm of NAIL_DIAMETERS_MM) {
    for (const loading of LOADINGS) {
      const p = { nailDiameterMm, loading }
      scenarios.push({
        id: scenarioId(nailDiameterMm, loading),
        nailDiameterMm,
        loading,
        weeks: Array.from({ length: WEEKS + 1 }, (_, week) => ({
          week,
          ifmMm: round(ifmMm(p, week), 3),
          implantStressMpa: round(implantStressMpa(p, week), 1),
          consolidationPct: round(consolidationPct(p, week), 1),
        })),
      })
    }
  }
  return {
    case: { bone: 'femur', fractureGapMm: 3, fixation: 'intramedullary nail' },
    scenarios,
  }
}
