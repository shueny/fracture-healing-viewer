// Illustrative healing model from the PRD ("示意資料模型"). Not medical data.
// One source of truth for the formulas: used by the callus shader inputs now
// and by generateScenarios.ts to build scenarios.json.

export const NAIL_DIAMETERS_MM = [10, 11] as const
export type NailDiameterMm = (typeof NAIL_DIAMETERS_MM)[number]
export const LOADINGS = ['partial', 'full'] as const
export type Loading = (typeof LOADINGS)[number]

export const K_NAIL: Record<NailDiameterMm, number> = { 10: 1.0, 11: 1.25 }
export const K_LOAD: Record<Loading, number> = { partial: 1.0, full: 1.6 }

// ADR 0001: above this initial movement, healing is delayed.
export const DELAYED_HEALING_THRESHOLD_MM = 1.1

export interface ScenarioParams {
  nailDiameterMm: NailDiameterMm
  loading: Loading
}

const loadRatio = (p: ScenarioParams) => K_LOAD[p.loading] / K_NAIL[p.nailDiameterMm]

export function initialIfmMm(p: ScenarioParams): number {
  return 0.8 * loadRatio(p)
}

export function isDelayed(p: ScenarioParams): boolean {
  return initialIfmMm(p) > DELAYED_HEALING_THRESHOLD_MM
}

// Time constants in weeks: tau for movement decay, tauC for consolidation.
export function timeConstants(p: ScenarioParams): { tau: number; tauC: number } {
  return isDelayed(p) ? { tau: 6, tauC: 8 } : { tau: 4, tauC: 5 }
}

// Interfragmentary movement IFM(t), mm.
export function ifmMm(p: ScenarioParams, week: number): number {
  return initialIfmMm(p) * Math.exp(-week / timeConstants(p).tau)
}

// Consolidation C(t), percent 0..100.
export function consolidationPct(p: ScenarioParams, week: number): number {
  return 100 * (1 - Math.exp(-week / timeConstants(p).tauC))
}

// Implant stress sigma(t), MPa. Load moves from nail to bone as C rises.
export function implantStressMpa(p: ScenarioParams, week: number): number {
  return 220 * loadRatio(p) * (1 - 0.7 * (consolidationPct(p, week) / 100))
}
