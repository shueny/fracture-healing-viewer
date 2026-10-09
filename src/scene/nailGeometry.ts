import { BufferAttribute, BufferGeometry, CylinderGeometry, Vector3 } from 'three'

// A closed round rod that follows a polyline (the nail along the bowed shaft,
// ADR 0019). Rings sit perpendicular to the local direction; flat caps close
// both ends, so the stencil cap can fill its cut face.
export function buildRodAlongCurve(
  points: Vector3[],
  radius: number,
  radialSegments = 32,
): BufferGeometry {
  const n = points.length
  const pos: number[] = []
  const index: number[] = []
  const tangent = (i: number) =>
    new Vector3().subVectors(points[Math.min(n - 1, i + 1)], points[Math.max(0, i - 1)]).normalize()

  // Ring frame: u is "sideways" (X for a vertical rod), v = t x u.
  for (let i = 0; i < n; i++) {
    const t = tangent(i)
    const u = new Vector3(0, 0, 1).cross(t).normalize()
    const v = new Vector3().crossVectors(t, u)
    for (let k = 0; k < radialSegments; k++) {
      const a = (2 * Math.PI * k) / radialSegments
      const p = points[i]
        .clone()
        .addScaledVector(u, Math.cos(a) * radius)
        .addScaledVector(v, Math.sin(a) * radius)
      pos.push(p.x, p.y, p.z)
    }
  }
  for (let i = 0; i + 1 < n; i++) {
    for (let k = 0; k < radialSegments; k++) {
      const k2 = (k + 1) % radialSegments
      const [a, b, c, d] = [
        i * radialSegments + k,
        i * radialSegments + k2,
        (i + 1) * radialSegments + k,
        (i + 1) * radialSegments + k2,
      ]
      index.push(a, b, c, b, d, c)
    }
  }
  // End caps: a centre vertex fanned to the end ring.
  const capStart = pos.length / 3
  pos.push(points[0].x, points[0].y, points[0].z)
  const capEnd = capStart + 1
  pos.push(points[n - 1].x, points[n - 1].y, points[n - 1].z)
  const lastRing = (n - 1) * radialSegments
  for (let k = 0; k < radialSegments; k++) {
    const k2 = (k + 1) % radialSegments
    index.push(capStart, k2, k)
    index.push(capEnd, lastRing + k, lastRing + k2)
  }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  g.setIndex(index)
  g.computeVertexNormals()
  return g
}

// A locking screw: 1 mm long along X, centred, so a group scale of
// [length, 1, 1] sets its real length without new geometry.
export function buildUnitScrew(diameterMm: number): BufferGeometry {
  const g = new CylinderGeometry(diameterMm / 2, diameterMm / 2, 1, 24)
  g.rotateZ(Math.PI / 2) // cylinder runs along Y; turn it to X
  return g
}
