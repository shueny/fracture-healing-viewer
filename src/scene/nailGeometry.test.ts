import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { FEMUR } from '../data/femur'
import { openEdges, signedVolume } from '../test/meshChecks'
import { NAIL } from './nailDimensions'
import { buildRodAlongCurve, buildUnitScrew } from './nailGeometry'

describe('nail geometry', () => {
  it('a straight rod has the volume of a cylinder and is closed', () => {
    const pts = Array.from({ length: 11 }, (_, i) => new Vector3(0, -50 + i * 10, 0))
    const g = buildRodAlongCurve(pts, 5, 64)
    expect(openEdges(g)).toBe(0)
    expect(signedVolume(g)).toBeCloseTo(Math.PI * 25 * 100, -2) // within ~1 %
  })

  it('the nail along the bowed centre line is closed, outward and 360 mm tall', () => {
    const pts = FEMUR.centerline
      .filter(([, y]) => Math.abs(y) <= NAIL.lengthMm / 2)
      .map(([x, y, z]) => new Vector3(x, y, z))
    const g = buildRodAlongCurve(pts, 5.5, 48)
    expect(openEdges(g)).toBe(0)
    expect(signedVolume(g)).toBeGreaterThan(0)
    // The path runs 360 mm; the end rings tilt with the bow, so the box can
    // be up to one diameter taller.
    expect(pts[pts.length - 1].y - pts[0].y).toBeCloseTo(NAIL.lengthMm)
    g.computeBoundingBox()
    const height = g.boundingBox!.max.y - g.boundingBox!.min.y
    expect(height).toBeGreaterThanOrEqual(NAIL.lengthMm)
    expect(height).toBeLessThan(NAIL.lengthMm + 11)
  })

  it('the unit screw is 1 mm long along X, so scale sets its length', () => {
    const g = buildUnitScrew(5)
    g.computeBoundingBox()
    expect(g.boundingBox!.max.x - g.boundingBox!.min.x).toBeCloseTo(1)
    expect(g.boundingBox!.max.y - g.boundingBox!.min.y).toBeCloseTo(5)
  })
})
