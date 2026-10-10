import { Vector3, type BufferGeometry } from 'three'

// Shared mesh checks for tests. A mesh the stencil cap can fill must be
// closed (every edge shared by exactly two triangles, after welding equal
// positions) and outward-facing (positive signed volume).

export function weldedEdgeCounts(g: BufferGeometry): Map<string, number> {
  const pos = g.getAttribute('position')
  const id = new Map<string, number>()
  const vid = (i: number) => {
    const k = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`
    if (!id.has(k)) id.set(k, id.size)
    return id.get(k)!
  }
  const index = g.getIndex()!
  const edges = new Map<string, number>()
  for (let i = 0; i < index.count; i += 3) {
    const t = [vid(index.getX(i)), vid(index.getX(i + 1)), vid(index.getX(i + 2))]
    for (let e = 0; e < 3; e++) {
      const [a, b] = [t[e], t[(e + 1) % 3]].sort((x, y) => x - y)
      if (a === b) continue
      const k = `${a}-${b}`
      edges.set(k, (edges.get(k) ?? 0) + 1)
    }
  }
  return edges
}

export const openEdges = (g: BufferGeometry) =>
  [...weldedEdgeCounts(g).values()].filter((c) => c !== 2).length

// Divergence theorem: sum of signed tetrahedra from the origin.
export function signedVolume(g: BufferGeometry): number {
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

// Holes: edges used an odd number of times. A closed surface may still touch
// itself along a line (an edge shared by 4 or 6 triangles); that keeps the
// inside/outside count of the stencil cap correct, so it is not a hole.
export const holeEdges = (g: BufferGeometry) =>
  [...weldedEdgeCounts(g).values()].filter((c) => c % 2 === 1).length
