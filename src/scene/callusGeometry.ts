import { LatheGeometry, Vector2 } from 'three'
import { CALLUS } from './callusModel'

export interface CallusShape {
  boneRadius: number // outer bone radius
  canalRadius: number // gap callus fills from here to the bone surface
  gapHalf: number // half of the fracture gap
}

// Closed 2D outline (r, y), revolved around the Y axis:
// outer bulge from -H to +H, back down along the bone surface, then the
// ring that fills the fracture gap between canal and bone surface.
export function callusProfile({ boneRadius, canalRadius, gapHalf }: CallusShape): Vector2[] {
  const H = CALLUS.halfLengthMm
  const rB = boneRadius + CALLUS.boneOffsetMm
  const pts: Vector2[] = []
  for (let i = 0; i <= CALLUS.profileSteps; i++) {
    const y = -H + (2 * H * i) / CALLUS.profileSteps
    const bulge = CALLUS.maxThicknessMm * (1 - (y / H) ** 2)
    pts.push(new Vector2(rB + bulge, y))
  }
  pts.push(
    new Vector2(rB, gapHalf),
    new Vector2(canalRadius, gapHalf),
    new Vector2(canalRadius, -gapHalf),
    new Vector2(rB, -gapHalf),
    new Vector2(rB, -H), // back to the start: the outline is closed
  )
  return pts
}

// Built once at full size; the shader shrinks it for earlier weeks.
export function buildCallusGeometry(shape: CallusShape) {
  return new LatheGeometry(callusProfile(shape), CALLUS.radialSegments)
}
