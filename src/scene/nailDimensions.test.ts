import { describe, expect, it } from 'vitest'
import { FEMUR_PLACEHOLDER } from './femurPlaceholder'
import { LOCKING_SCREW, NAIL, NAIL_DIAMETERS_MM, nailScale } from './nailDimensions'

describe('nail', () => {
  it('scales a unit-diameter cylinder to the chosen diameter, length unchanged', () => {
    expect(nailScale(10)).toEqual([10, 1, 10])
    expect(nailScale(11)).toEqual([11, 1, 11])
  })

  it('both diameters fit inside the medullary canal', () => {
    for (const d of NAIL_DIAMETERS_MM) {
      expect(d / 2).toBeLessThan(FEMUR_PLACEHOLDER.canalRadiusMm)
    }
  })

  it('stays inside the bone and spans the fracture gap', () => {
    const boneHalfLength = FEMUR_PLACEHOLDER.segmentLengthMm + FEMUR_PLACEHOLDER.fractureGapMm / 2
    expect(NAIL.lengthMm / 2).toBeLessThan(boneHalfLength)
    expect(NAIL.lengthMm / 2).toBeGreaterThan(FEMUR_PLACEHOLDER.fractureGapMm / 2)
  })
})

describe('locking screws', () => {
  it('has two screws in each fragment', () => {
    expect(LOCKING_SCREW.offsetsMm.filter((y) => y > 0)).toHaveLength(2)
    expect(LOCKING_SCREW.offsetsMm.filter((y) => y < 0)).toHaveLength(2)
  })

  it('every screw goes through the nail and both cortices', () => {
    const r = LOCKING_SCREW.diameterMm / 2
    for (const y of LOCKING_SCREW.offsetsMm) {
      expect(Math.abs(y) + r).toBeLessThan(NAIL.lengthMm / 2)
    }
    expect(LOCKING_SCREW.lengthMm / 2).toBeGreaterThan(FEMUR_PLACEHOLDER.outerRadiusMm)
  })
})
