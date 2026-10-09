import { describe, expect, it } from 'vitest'
import { FEMUR } from '../data/femur'
import { openEdges, signedVolume } from '../test/meshChecks'
import { buildCallusGeometry } from './callusGeometry'
import { CALLUS } from './callusModel'

const shape = {
  rings: FEMUR.callus.rings,
  canalRadius: FEMUR.canalRadiusMm,
  gapHalf: FEMUR.fractureGapMm / 2,
}
const g = buildCallusGeometry(shape)

describe('callus geometry on the real femur', () => {
  it('is closed and faces outward (needed for the section cap)', () => {
    expect(openEdges(g)).toBe(0)
    expect(signedVolume(g)).toBeGreaterThan(0)
  })

  it('spans the callus length and leaves room for the nail in the gap', () => {
    g.computeBoundingBox()
    expect(g.boundingBox!.min.y).toBeCloseTo(-CALLUS.halfLengthMm)
    expect(g.boundingBox!.max.y).toBeCloseTo(CALLUS.halfLengthMm)
    expect(shape.canalRadius).toBeGreaterThan(11 / 2) // thickest nail
  })

  it('outer bulge vertices sit outside the bone; the rest sit on it or in the gap', () => {
    const pos = g.getAttribute('position')
    const base = g.getAttribute('aBase')
    const ext = g.getAttribute('aExternal')
    let bulge = 0
    for (let i = 0; i < pos.count; i++) {
      const dx = pos.getX(i) - base.getX(i)
      const dz = pos.getZ(i) - base.getZ(i)
      const r = Math.hypot(dx, dz)
      if (ext.getX(i) === 1) {
        bulge++
        expect(r).toBeLessThanOrEqual(CALLUS.maxThicknessMm + 1e-3)
      } else if (Math.abs(pos.getY(i)) > shape.gapHalf + 1e-3) {
        expect(r).toBeLessThan(1e-3) // inner wall lies on the bone surface
      }
    }
    expect(bulge).toBe(FEMUR.callus.rings.length * FEMUR.callus.radialSegments)
  })
})
