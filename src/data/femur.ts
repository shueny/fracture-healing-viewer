// Measurements of the real femur, written by scripts/buildFemur.ts next to
// public/models/femur.glb (ADR 0019). App coordinates: mm, Y up, fracture
// line at y = 0, the coronal section plane at z = 0.
import data from './femur.json'

export interface CallusRing {
  y: number
  center: [number, number] // (x, z) of the shaft centre line at this height
  radii: number[] // outer bone surface distance from the centre, per angle
}

export interface FemurData {
  source: string
  licence: string
  lengthMm: number
  fractureGapMm: number
  canalRadiusMm: number
  centerline: [number, number, number][] // (x, y, z), every 5 mm in y
  callus: { radialSegments: number; rings: CallusRing[] }
  screws: { y: number; center: [number, number]; lengthMm: number }[]
}

export const FEMUR = data as unknown as FemurData

// Centre line (x, z) at height y, by linear interpolation between samples.
export function centerlineAt(y: number): [number, number] {
  const pts = FEMUR.centerline
  if (y <= pts[0][1]) return [pts[0][0], pts[0][2]]
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][1]) {
      const [a, b] = [pts[i - 1], pts[i]]
      const t = (y - a[1]) / (b[1] - a[1])
      return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t]
    }
  }
  const last = pts[pts.length - 1]
  return [last[0], last[2]]
}
