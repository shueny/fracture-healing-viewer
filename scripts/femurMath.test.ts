import { describe, expect, it } from 'vitest'
import {
  applyRows,
  polyEval,
  polyFit,
  polygonsCentroid,
  rayFarthestHit,
  rotationToZ,
  zUpToYUp,
  type V2,
} from './femurMath.ts'

const square = (cx: number, cy: number, h: number): V2[] => [
  [cx - h, cy - h],
  [cx + h, cy - h],
  [cx + h, cy + h],
  [cx - h, cy + h],
]

describe('femur maths', () => {
  it('polygon centroid and area', () => {
    const { centroid, area } = polygonsCentroid([square(3, -2, 1)])
    expect(centroid[0]).toBeCloseTo(3)
    expect(centroid[1]).toBeCloseTo(-2)
    expect(area).toBeCloseTo(4)
  })

  it('ray hits the far side of the outline', () => {
    expect(rayFarthestHit([square(0, 0, 2)], [0, 0], [1, 0])).toBeCloseTo(2)
    expect(rayFarthestHit([square(0, 0, 2)], [0, 0], [Math.SQRT1_2, Math.SQRT1_2])).toBeCloseTo(
      2 * Math.SQRT2,
    )
  })

  it('polynomial fit recovers a cubic', () => {
    const xs = Array.from({ length: 30 }, (_, i) => i - 15)
    const c = [1, -0.5, 0.02, 0.001]
    const fit = polyFit(
      xs,
      xs.map((x) => polyEval(c, x)),
      3,
    )
    fit.forEach((v, i) => expect(v).toBeCloseTo(c[i], 6))
  })

  it('rotation takes any axis onto +Z', () => {
    for (const a of [
      [0.1, 0.2, 0.97],
      [0, -0.05, 1],
      [0.3, 0, 0.95],
    ] as [number, number, number][]) {
      const l = Math.hypot(...a)
      const r = applyRows(rotationToZ(a), [a[0] / l, a[1] / l, a[2] / l])
      expect(r[0]).toBeCloseTo(0)
      expect(r[1]).toBeCloseTo(0)
      expect(r[2]).toBeCloseTo(1)
    }
  })

  it('Z-up front (-Y) becomes the app camera side (+Z)', () => {
    const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]))
    close(zUpToYUp([0, -1, 0]), [0, 0, 1])
    close(zUpToYUp([0, 0, 1]), [0, 1, 0])
  })
})
