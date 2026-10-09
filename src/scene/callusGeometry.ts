import { BufferAttribute, BufferGeometry } from 'three'
import type { CallusRing } from '../data/femur'
import { CALLUS } from './callusModel'

export interface CallusShape {
  rings: CallusRing[] // measured bone cross-sections, y from -H to +H
  canalRadius: number // the gap callus fills from here outwards
  gapHalf: number // half of the fracture gap
}

// Callus that hugs the real bone. For every angle around the shaft we walk
// one closed outline in (radius, y):
//   outer bulge from -H to +H (bone surface + parabola),
//   back down along the bone surface to the fracture gap,
//   across the gap at canal radius,
//   down the bone surface again to -H.
// Each vertex also stores where it sits on the bone surface (aBase) and
// whether it belongs to the outer bulge (aExternal); the vertex shader uses
// both to shrink the callus for earlier weeks (ADR 0009, 0019).
export function buildCallusGeometry(shape: CallusShape): BufferGeometry {
  const { rings, canalRadius, gapHalf } = shape
  const H = CALLUS.halfLengthMm
  const off = CALLUS.boneOffsetMm
  const nA = rings[0].radii.length
  const last = rings.length - 1

  // Bone radius and centre at any y, interpolated between measured rings.
  const at = (y: number, a: number) => {
    const f = ((y + H) / (2 * H)) * last
    const i = Math.min(last - 1, Math.max(0, Math.floor(f)))
    const t = f - i
    const [r0, r1] = [rings[i], rings[i + 1]]
    return {
      r: r0.radii[a] + (r1.radii[a] - r0.radii[a]) * t,
      cx: r0.center[0] + (r1.center[0] - r0.center[0]) * t,
      cz: r0.center[1] + (r1.center[1] - r0.center[1]) * t,
    }
  }

  // One outline per angle: which height, and where the point sits.
  type Kind = 'bulge' | 'surface' | 'canal'
  const outline: [number, Kind][] = rings.map((r) => [r.y, 'bulge'])
  const inner = rings.map((r) => r.y).filter((y) => Math.abs(y) > gapHalf && Math.abs(y) < H)
  for (const y of inner.filter((y) => y > 0).reverse()) outline.push([y, 'surface'])
  outline.push([gapHalf, 'surface'], [gapHalf, 'canal'], [-gapHalf, 'canal'], [-gapHalf, 'surface'])
  for (const y of inner.filter((y) => y < 0).reverse()) outline.push([y, 'surface'])
  const nP = outline.length

  const positions = new Float32Array(nA * nP * 3)
  const bases = new Float32Array(nA * nP * 3)
  const external = new Float32Array(nA * nP)
  for (let a = 0; a < nA; a++) {
    const theta = (2 * Math.PI * a) / nA
    const [dx, dz] = [Math.cos(theta), Math.sin(theta)]
    outline.forEach(([y, kind], p) => {
      const { r, cx, cz } = at(y, a)
      const surface = r + off
      const bulge = CALLUS.maxThicknessMm * (1 - (y / H) ** 2)
      const radius = kind === 'canal' ? canalRadius : kind === 'surface' ? surface : surface + bulge
      const i = a * nP + p
      positions.set([cx + dx * radius, y, cz + dz * radius], i * 3)
      bases.set([cx + dx * surface, y, cz + dz * surface], i * 3)
      external[i] = kind === 'bulge' ? 1 : 0
    })
  }

  // Quads between neighbouring angles and outline points; both wrap round,
  // so the surface is closed (needed for the stencil cap).
  const index: number[] = []
  for (let a = 0; a < nA; a++) {
    const a2 = (a + 1) % nA
    for (let p = 0; p < nP; p++) {
      const p2 = (p + 1) % nP
      const [v00, v01, v10, v11] = [a * nP + p, a * nP + p2, a2 * nP + p, a2 * nP + p2]
      index.push(v00, v01, v10, v10, v01, v11)
    }
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(positions, 3))
  g.setAttribute('aBase', new BufferAttribute(bases, 3))
  g.setAttribute('aExternal', new BufferAttribute(external, 1))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}
