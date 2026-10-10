// Small, pure geometry helpers for buildFemur.ts (unit-tested).

export type V2 = [number, number]
export type V3 = [number, number, number]

export const norm = (a: V3): V3 => {
  const l = Math.hypot(...a)
  return [a[0] / l, a[1] / l, a[2] / l]
}

// Area-weighted centroid and signed area of a set of polygons (a slice).
export function polygonsCentroid(polys: V2[][]): { centroid: V2; area: number } {
  let a = 0
  let cx = 0
  let cy = 0
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i]
      const [x2, y2] = poly[(i + 1) % poly.length]
      const cross = x1 * y2 - x2 * y1
      a += cross
      cx += (x1 + x2) * cross
      cy += (y1 + y2) * cross
    }
  }
  return { centroid: [cx / (3 * a), cy / (3 * a)], area: a / 2 }
}

// Farthest hit of the ray origin + t * dir (t > 0) with any polygon edge:
// the outer surface of the bone in that direction.
export function rayFarthestHit(polys: V2[][], origin: V2, dir: V2): number {
  let best = 0
  for (const poly of polys) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]
      const q = poly[(i + 1) % poly.length]
      const ex = q[0] - p[0]
      const ey = q[1] - p[1]
      const den = dir[0] * ey - dir[1] * ex
      if (Math.abs(den) < 1e-12) continue
      const wx = p[0] - origin[0]
      const wy = p[1] - origin[1]
      const t = (wx * ey - wy * ex) / den
      const s = (wx * dir[1] - wy * dir[0]) / den
      if (t > 0 && s >= 0 && s <= 1) best = Math.max(best, t)
    }
  }
  return best
}

// Least-squares polynomial fit y = c0 + c1 x + ... (normal equations).
export function polyFit(xs: number[], ys: number[], degree: number): number[] {
  const n = degree + 1
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0))
  for (let k = 0; k < xs.length; k++) {
    const pw = Array.from({ length: 2 * n }, (_, i) => xs[k] ** i)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += pw[i + j]
      A[i][n] += pw[i] * ys[k]
    }
  }
  // Gaussian elimination with partial pivoting.
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r
    ;[A[c], A[piv]] = [A[piv], A[c]]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]
    }
  }
  return A.map((row, i) => row[n] / row[i])
}

export const polyEval = (c: number[], x: number) => c.reduce((s, ci, i) => s + ci * x ** i, 0)

// Rotation matrix (rows) that turns unit vector `a` onto +Z (Rodrigues).
export function rotationToZ(a: V3): number[][] {
  const [x, y, z] = norm(a)
  const sn = Math.hypot(x, y)
  if (sn < 1e-12)
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
  const [kx, ky] = [y / sn, -x / sn] // a x Z, normalised
  const c = z
  const t = 1 - c
  return [
    [t * kx * kx + c, t * kx * ky, sn * ky],
    [t * kx * ky, t * ky * ky + c, -sn * kx],
    [-sn * ky, sn * kx, c],
  ]
}

export const applyRows = (r: number[][], v: V3): V3 => [
  r[0][0] * v[0] + r[0][1] * v[1] + r[0][2] * v[2],
  r[1][0] * v[0] + r[1][1] * v[1] + r[1][2] * v[2],
  r[2][0] * v[0] + r[2][1] * v[1] + r[2][2] * v[2],
]

// Z-up (BodyParts3D) -> Y-up (app): (x, y, z) -> (x, z, -y). BodyParts3D's
// front is -Y, so the front of the bone ends up facing the app's +Z camera.
export const zUpToYUp = (v: V3): V3 => [v[0], v[2], -v[1]]
