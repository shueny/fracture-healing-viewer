import { Suspense } from 'react'
import { consolidationPct, type ScenarioParams } from '../data/healingModel'
import { useViewerStore } from '../store/useViewerStore'
import { Callus } from './Callus'
import { FemurModel } from './FemurModel'
import { FEMUR_PLACEHOLDER } from './femurPlaceholder'
import { Nail } from './Nail'

const CALLUS_SHAPE = {
  boneRadius: FEMUR_PLACEHOLDER.outerRadiusMm,
  canalRadius: FEMUR_PLACEHOLDER.canalRadiusMm,
  gapHalf: FEMUR_PLACEHOLDER.fractureGapMm / 2,
}

// One fracture with one fixation scenario at the current week.
export function FractureScene({ scenario }: { scenario: ScenarioParams }) {
  const week = useViewerStore((s) => s.week)
  return (
    <Suspense fallback={null}>
      <FemurModel />
      <Callus shape={CALLUS_SHAPE} consolidationPct={consolidationPct(scenario, week)} />
      <Nail diameterMm={scenario.nailDiameterMm} />
    </Suspense>
  )
}
