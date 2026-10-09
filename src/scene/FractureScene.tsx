import { Suspense } from 'react'
import { FEMUR } from '../data/femur'
import type { ScenarioParams } from '../data/healingModel'
import { getScenario, valueAt } from '../data/scenarios'
import { useViewerStore } from '../store/useViewerStore'
import { Callus } from './Callus'
import type { CallusShape } from './callusGeometry'
import { FemurModel } from './FemurModel'
import { Nail } from './Nail'

// The callus hugs the real bone: measured cross-sections from femur.json.
const CALLUS_SHAPE: CallusShape = {
  rings: FEMUR.callus.rings,
  canalRadius: FEMUR.canalRadiusMm,
  gapHalf: FEMUR.fractureGapMm / 2,
}

// One fracture with one fixation scenario at the current week.
export function FractureScene({ scenario }: { scenario: ScenarioParams }) {
  const week = useViewerStore((s) => s.week)
  const consolidation = valueAt(getScenario(scenario), 'consolidationPct', week)
  return (
    <Suspense fallback={null}>
      <FemurModel />
      <Callus shape={CALLUS_SHAPE} consolidationPct={consolidation} />
      <Nail diameterMm={scenario.nailDiameterMm} />
    </Suspense>
  )
}
