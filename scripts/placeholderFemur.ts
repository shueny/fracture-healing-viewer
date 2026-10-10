// Placeholder femur shaft: two hollow tubes with a fracture gap between them.
// Same units and axes as the real model will have (mm, long axis on Y, gap
// centred at y = 0), so the Blender export can replace the file later.

import { BufferGeometry, CylinderGeometry, RingGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { FEMUR_PLACEHOLDER } from '../src/scene/femurPlaceholder.ts'
import type { GlbMesh } from './glb.ts'

export { FEMUR_PLACEHOLDER }

export interface SegmentSpec {
  outerRadius: number
  innerRadius: number
  yBottom: number
  yTop: number
  radialSegments: number
}

// Turn faces inside out: reverse triangle winding and negate normals.
function flipInsideOut(geometry: BufferGeometry) {
  const index = geometry.getIndex()!
  for (let i = 0; i < index.count; i += 3) {
    const b = index.getX(i + 1)
    index.setX(i + 1, index.getX(i + 2))
    index.setX(i + 2, b)
  }
  const normal = geometry.getAttribute('normal')
  for (let i = 0; i < normal.array.length; i++) normal.array[i] *= -1
}

// A closed hollow tube: outer wall, inner (canal) wall, and two ring ends.
export function buildBoneSegment(spec: SegmentSpec): BufferGeometry {
  const { outerRadius, innerRadius, yBottom, yTop, radialSegments } = spec
  const height = yTop - yBottom
  const yMid = (yTop + yBottom) / 2

  const outer = new CylinderGeometry(outerRadius, outerRadius, height, radialSegments, 1, true)
  const inner = new CylinderGeometry(innerRadius, innerRadius, height, radialSegments, 1, true)
  flipInsideOut(inner) // canal wall faces toward the axis

  const top = new RingGeometry(innerRadius, outerRadius, radialSegments)
  top.rotateX(-Math.PI / 2) // ring faces +Z by default; turn it to +Y
  top.translate(0, height / 2, 0)

  const bottom = new RingGeometry(innerRadius, outerRadius, radialSegments)
  bottom.rotateX(Math.PI / 2) // faces -Y
  bottom.translate(0, -height / 2, 0)

  const parts = [outer, inner, top, bottom]
  for (const part of parts) part.deleteAttribute('uv')
  const merged = mergeGeometries(parts)
  merged.translate(0, yMid, 0)
  return merged
}

export function buildPlaceholderFemur(): GlbMesh[] {
  const p = FEMUR_PLACEHOLDER
  const halfGap = p.fractureGapMm / 2
  const common = {
    outerRadius: p.outerRadiusMm,
    innerRadius: p.canalRadiusMm,
    radialSegments: p.radialSegments,
  }
  const segments = {
    proximal: buildBoneSegment({ ...common, yBottom: halfGap, yTop: halfGap + p.segmentLengthMm }),
    distal: buildBoneSegment({ ...common, yBottom: -halfGap - p.segmentLengthMm, yTop: -halfGap }),
  }
  return Object.entries(segments).map(([name, geometry]) => ({
    name,
    positions: geometry.getAttribute('position').array as Float32Array,
    normals: geometry.getAttribute('normal').array as Float32Array,
    indices: Uint32Array.from(geometry.getIndex()!.array),
  }))
}
