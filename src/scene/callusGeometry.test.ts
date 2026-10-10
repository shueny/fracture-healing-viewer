import { Vector3, type BufferGeometry } from 'three'
import { describe, expect, it } from 'vitest'
import { FEMUR_PLACEHOLDER } from './femurPlaceholder'
import { buildCallusGeometry, callusProfile } from './callusGeometry'
import { CALLUS, GAP_CALLUS_INNER_RADIUS_MIN_MM } from './callusModel'

const shape = {
  boneRadius: FEMUR_PLACEHOLDER.outerRadiusMm,
  canalRadius: FEMUR_PLACEHOLDER.canalRadiusMm,
  gapHalf: FEMUR_PLACEHOLDER.fractureGapMm / 2,
}

// Divergence theorem: sum of signed tetrahedron volumes over all triangles.
// Positive means every face points outward (needed for the stencil cap).
function signedVolume(g: BufferGeometry) {
  const pos = g.getAttribute('position')
  const index = g.getIndex()!
  const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()]
  let v = 0
  for (let i = 0; i < index.count; i += 3) {
    a.fromBufferAttribute(pos, index.getX(i))
    b.fromBufferAttribute(pos, index.getX(i + 1))
    c.fromBufferAttribute(pos, index.getX(i + 2))
    v += a.dot(b.clone().cross(c)) / 6
  }
  return v
}

describe('callus geometry', () => {
  it('outline is closed', () => {
    const p = callusProfile(shape)
    expect(p[0].equals(p[p.length - 1])).toBe(true)
  })

  it('is a closed solid with outward faces and a plausible volume', () => {
    const g = buildCallusGeometry(shape)
    const v = signedVolume(g)
    expect(v).toBeGreaterThan(0)
    // Rough check against the bulge (parabola) plus the gap ring, in mm^3.
    const rB = shape.boneRadius
    const T = CALLUS.maxThicknessMm
    const H = CALLUS.halfLengthMm
    const bulge = Math.PI * ((4 / 3) * 2 * rB * T * H + (16 / 15) * T * T * H)
    const ring = Math.PI * (rB ** 2 - shape.canalRadius ** 2) * 2 * shape.gapHalf
    expect(v).toBeGreaterThan(0.95 * (bulge + ring))
    expect(v).toBeLessThan(1.05 * (bulge + ring))
  })

  it('leaves room for the thickest nail inside the gap callus', () => {
    expect(shape.canalRadius).toBeGreaterThan(GAP_CALLUS_INNER_RADIUS_MIN_MM)
  })
})
