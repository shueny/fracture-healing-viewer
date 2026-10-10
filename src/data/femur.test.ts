import { describe, expect, it } from 'vitest'
import { CALLUS } from '../scene/callusModel'
import { NAIL, NAIL_DIAMETERS_MM } from '../scene/nailDimensions'
import { FEMUR, centerlineAt } from './femur'

describe('femur.json (measured from the real femur)', () => {
  it('is an adult femur of plausible length', () => {
    expect(FEMUR.lengthMm).toBeGreaterThan(400)
    expect(FEMUR.lengthMm).toBeLessThan(520)
    expect(FEMUR.source).toContain('FMA24474')
  })

  it('centre line passes through the fracture line at the origin and covers the nail', () => {
    const [x, z] = centerlineAt(0)
    expect(Math.abs(x)).toBeLessThan(0.01)
    expect(Math.abs(z)).toBeLessThan(0.01)
    const ys = FEMUR.centerline.map((p) => p[1])
    expect(Math.min(...ys)).toBeLessThanOrEqual(-NAIL.lengthMm / 2)
    expect(Math.max(...ys)).toBeGreaterThanOrEqual(NAIL.lengthMm / 2)
  })

  it('both nail diameters fit the canal', () => {
    for (const d of NAIL_DIAMETERS_MM) expect(d / 2).toBeLessThan(FEMUR.canalRadiusMm)
  })

  it('callus cross-sections match the callus model and leave a real cortex', () => {
    expect(FEMUR.callus.rings).toHaveLength(CALLUS.profileSteps + 1)
    expect(FEMUR.callus.radialSegments).toBe(CALLUS.radialSegments)
    for (const ring of FEMUR.callus.rings) {
      for (const r of ring.radii) expect(r).toBeGreaterThan(FEMUR.canalRadiusMm + 3)
    }
  })

  it('two locking screws per fragment, each long enough to cross the bone', () => {
    expect(FEMUR.screws.filter((s) => s.y > 0)).toHaveLength(2)
    expect(FEMUR.screws.filter((s) => s.y < 0)).toHaveLength(2)
    for (const s of FEMUR.screws) {
      expect(Math.abs(s.y)).toBeLessThan(NAIL.lengthMm / 2)
      expect(s.lengthMm).toBeGreaterThan(30)
    }
  })
})
