// Builds public/models/femur.glb and src/data/femur.json from a BodyParts3D
// femur OBJ (mm, Z up). Replaces the PRD's manual Blender steps (ADR 0019):
//   1. weld duplicate vertices so the mesh is closed
//   2. smooth + subdivide (PRD: "Subdivision + Smooth")
//   3. stand the shaft axis on Z, mid-length point at the origin
//   4. measure the shaft centre line (the femur bows forward)
//   5. bore the medullary canal along that curved line, check it stays inside
//   6. cut the 3 mm fracture gap -> proximal + distal pieces
//   7. measure what the app needs (callus cross-sections, screw lengths)
//   8. Z-up -> Y-up, export GLB + femur.json
// manifold-3d's boolean operations always return closed meshes, which the
// section cap (stencil, ADR 0006) needs.
//
// Run: pnpm build:femur [path/to/FMA24474.obj]   (default data/raw/FMA24474.obj)

import Module from 'manifold-3d'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { BufferAttribute, BufferGeometry } from 'three'
import { mergeVertices, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  applyRows,
  norm,
  polyEval,
  polyFit,
  polygonsCentroid,
  rayFarthestHit,
  rotationToZ,
  zUpToYUp,
  type V2,
  type V3,
} from './femurMath.ts'
import { encodeGlb, type GlbMesh } from './glb.ts'

const root = join(import.meta.dirname, '..')
const input = resolve(process.argv[2] ?? join(root, 'data/raw/FMA24474.obj'))

export const FEMUR_BUILD = {
  fractureGapMm: 3,
  canalRadiusMm: 6.5, // 13 mm reamed canal: room for the 11 mm nail
  canalHalfLengthMm: 185, // the 360 mm nail plus 5 mm at each end
  refine: 4, // each edge split in 4: 16x the triangles (PRD: Subdivision)
  creaseAngleDeg: 40, // sharper corners (cut faces) keep flat normals
  axisSampleMm: 70, // slices +/- this far from mid-length define the axis
  centerlineStepMm: 5,
  centerlineDegree: 3,
  // Callus cross-sections (must match CALLUS in src/scene/callusModel.ts).
  callusHalfLengthMm: 25,
  callusProfileSteps: 32,
  callusRadialSegments: 96,
  screwOffsetsMm: [-165, -140, 140, 165],
  screwProtrudeMm: 3, // screw tips stand out of the bone on both sides
} as const

// ---------- 1. OBJ in, welded ----------
function readObj(path: string) {
  const verts: number[] = []
  const tris: number[] = []
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const p = line.trim().split(/\s+/)
    if (p[0] === 'v') verts.push(+p[1], +p[2], +p[3])
    else if (p[0] === 'f') {
      const ids = p.slice(1).map((t) => parseInt(t.split('/')[0], 10) - 1)
      for (let i = 1; i + 1 < ids.length; i++) tris.push(ids[0], ids[i], ids[i + 1])
    }
  }
  // Weld: positions equal to 1 µm become one vertex, so edges are shared.
  const index = new Map<string, number>()
  const remap: number[] = []
  const welded: number[] = []
  for (let i = 0; i < verts.length / 3; i++) {
    const k = verts
      .slice(i * 3, i * 3 + 3)
      .map((v) => v.toFixed(3))
      .join(',')
    if (!index.has(k)) {
      index.set(k, welded.length / 3)
      welded.push(verts[i * 3], verts[i * 3 + 1], verts[i * 3 + 2])
    }
    remap.push(index.get(k)!)
  }
  const out: number[] = []
  for (let i = 0; i < tris.length; i += 3) {
    const t = [remap[tris[i]], remap[tris[i + 1]], remap[tris[i + 2]]]
    if (new Set(t).size === 3) out.push(...t)
  }
  return { verts: new Float32Array(welded), tris: new Uint32Array(out) }
}

const wasm = await Module()
wasm.setup()
const { Manifold, Mesh, CrossSection } = wasm
type M = InstanceType<typeof Manifold>

const raw = readObj(input)
let bone: M = Manifold.ofMesh(
  new Mesh({ numProp: 3, vertProperties: raw.verts, triVerts: raw.tris }),
)
if (bone.status() !== 'NoError') throw new Error(`source mesh is not closed: ${bone.status()}`)
const sourceTriangles = raw.tris.length / 3

// ---------- 2. smooth + subdivide ----------
bone = Manifold.smooth(bone.getMesh()).refine(FEMUR_BUILD.refine)

const slicePolys = (m: M, z: number) => m.slice(z).toPolygons() as V2[][]
const centroidAt = (m: M, z: number): V3 => [...polygonsCentroid(slicePolys(m, z)).centroid, z]

// ---------- 3. shaft axis onto Z, mid-length at the origin ----------
{
  const { min, max } = bone.boundingBox()
  const zMid = (min[2] + max[2]) / 2 // PRD: mid-shaft fracture
  const s = FEMUR_BUILD.axisSampleMm
  const [a, b] = [centroidAt(bone, zMid - s), centroidAt(bone, zMid + s)]
  const axis = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]])
  const mid = centroidAt(bone, zMid)
  const r = rotationToZ(axis)
  bone = bone.translate([-mid[0], -mid[1], -mid[2]]).warp((v) => {
    const [x, y, z] = applyRows(r, [v[0], v[1], v[2]])
    v[0] = x
    v[1] = y
    v[2] = z
  })
  // re-centre exactly on the fracture-line centroid after the rotation
  const c0 = centroidAt(bone, 0)
  bone = bone.translate([-c0[0], -c0[1], 0])
}
const lengthMm = bone.boundingBox().max[2] - bone.boundingBox().min[2]

// ---------- 4. centre line: cubic fit of slice centroids ----------
const half = FEMUR_BUILD.canalHalfLengthMm
const zs: number[] = []
for (let z = -half; z <= half; z += FEMUR_BUILD.centerlineStepMm) zs.push(z)
const cents = zs.map((z) => centroidAt(bone, z))
const fitX = polyFit(
  zs,
  cents.map((c) => c[0]),
  FEMUR_BUILD.centerlineDegree,
)
const fitY = polyFit(
  zs,
  cents.map((c) => c[1]),
  FEMUR_BUILD.centerlineDegree,
)
// Pin the line to pass through the origin (the fracture-line centroid).
fitX[0] -= polyEval(fitX, 0)
fitY[0] -= polyEval(fitY, 0)
const centre = (z: number): V2 => [polyEval(fitX, z), polyEval(fitY, z)]

// ---------- 5. medullary canal along the curved centre line ----------
const canal = Manifold.extrude(
  CrossSection.circle(FEMUR_BUILD.canalRadiusMm, 48),
  2 * half,
  148, // a ring every 2.5 mm so the bend is smooth
  0,
  1,
  true,
).warp((v) => {
  const [cx, cy] = centre(v[2])
  v[0] += cx
  v[1] += cy
})
const breakthroughMm3 = canal.subtract(bone).volume()
if (breakthroughMm3 > 1)
  throw new Error(`canal breaks through the cortex (${breakthroughMm3.toFixed(1)} mm^3)`)
const solidBone = bone // before canal and gap: used for outer measurements
bone = bone.subtract(canal)

// ---------- 6. fracture gap ----------
const gap = Manifold.cube([400, 400, FEMUR_BUILD.fractureGapMm], true)
const pieces = bone.subtract(gap).decompose()
if (pieces.length !== 2)
  throw new Error(`expected 2 bone pieces after the cut, got ${pieces.length}`)
pieces.sort((a, b) => b.boundingBox().min[2] - a.boundingBox().min[2]) // proximal (top) first

// ---------- 7. measurements, converted to app coordinates (Y-up) ----------
// Angle theta goes round the app's (x, z) plane: app dir (cos, sin) is the
// Z-up dir (cos, -sin), because app z = -(Z-up y).
const H = FEMUR_BUILD.callusHalfLengthMm
const ringYs = Array.from(
  { length: FEMUR_BUILD.callusProfileSteps + 1 },
  (_, i) => -H + (2 * H * i) / FEMUR_BUILD.callusProfileSteps,
)
const callusRings = ringYs.map((y) => {
  // In the fracture gap there is no bone yet: use the cut face just above.
  const zz = Math.abs(y) < FEMUR_BUILD.fractureGapMm / 2 + 0.01 ? Math.sign(y || 1) * 1.6 : y
  const polys = slicePolys(solidBone, zz)
  const c = centre(zz)
  const radii = Array.from({ length: FEMUR_BUILD.callusRadialSegments }, (_, i) => {
    const t = (2 * Math.PI * i) / FEMUR_BUILD.callusRadialSegments
    return +rayFarthestHit(polys, c, [Math.cos(t), -Math.sin(t)]).toFixed(2)
  })
  const [x, , z] = zUpToYUp([c[0], c[1], y])
  return { y: +y.toFixed(4), center: [+x.toFixed(3), +z.toFixed(3)], radii }
})

const screws = FEMUR_BUILD.screwOffsetsMm.map((y) => {
  const polys = slicePolys(solidBone, y)
  const c = centre(y)
  const plus = rayFarthestHit(polys, c, [1, 0])
  const minus = rayFarthestHit(polys, c, [-1, 0])
  const [x, , z] = zUpToYUp([c[0] + (plus - minus) / 2, c[1], y])
  return {
    y,
    center: [+x.toFixed(2), +z.toFixed(2)],
    lengthMm: +(plus + minus + 2 * FEMUR_BUILD.screwProtrudeMm).toFixed(1),
  }
})

const centerline = zs.map((z) => {
  const [x, y] = centre(z)
  return zUpToYUp([x, y, z]).map((v) => +v.toFixed(3))
})

// ---------- 8. GLB ----------
const names = ['proximal', 'distal']
const meshes: GlbMesh[] = pieces.map((p, i) => {
  const m = p.getMesh()
  const pos = new Float32Array(m.numVert * 3)
  for (let v = 0; v < m.numVert; v++) {
    const yUp = zUpToYUp([
      m.vertProperties[v * m.numProp],
      m.vertProperties[v * m.numProp + 1],
      m.vertProperties[v * m.numProp + 2],
    ])
    pos.set(yUp, v * 3)
  }
  let g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setIndex(new BufferAttribute(new Uint32Array(m.triVerts), 1))
  // The (x, y, z) -> (x, z, -y) swap is a proper rotation, so triangle
  // winding stays outward. Smooth normals, but crisp at the cut and canal.
  g = mergeVertices(toCreasedNormals(g, (FEMUR_BUILD.creaseAngleDeg * Math.PI) / 180))
  return {
    name: names[i],
    positions: g.getAttribute('position').array as Float32Array,
    normals: g.getAttribute('normal').array as Float32Array,
    indices: Uint32Array.from(g.getIndex()!.array),
  }
})
const glb = encodeGlb(meshes, { name: 'bone', baseColor: [0.87, 0.84, 0.76, 1] })
writeFileSync(join(root, 'public/models/femur.glb'), glb)

const femur = {
  source: 'BodyParts3D 4.0, right femur FMA24474',
  sourceRoute:
    'github.com/ashemag/human-atlas repack (official site unreachable at build time; ADR 0019)',
  licence:
    'CC BY 4.0, © The Database Center for Life Science; modified (smoothed, cut, canal bored)',
  sourceTriangles,
  triangles: meshes.reduce((n, m) => n + m.indices.length / 3, 0),
  glbKB: +(glb.length / 1024).toFixed(1),
  lengthMm: +lengthMm.toFixed(1),
  fractureGapMm: FEMUR_BUILD.fractureGapMm,
  canalRadiusMm: FEMUR_BUILD.canalRadiusMm,
  canalBreakthroughMm3: +breakthroughMm3.toFixed(3),
  // App coordinates (mm, Y up, fracture line at y = 0).
  centerline,
  callus: { radialSegments: FEMUR_BUILD.callusRadialSegments, rings: callusRings },
  screws,
}
writeFileSync(join(root, 'src/data/femur.json'), JSON.stringify(femur) + '\n')
console.log(
  JSON.stringify(
    { ...femur, centerline: `${centerline.length} points`, callus: `${callusRings.length} rings` },
    null,
    2,
  ),
)
