import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Box3, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'
import { FEMUR_PLACEHOLDER, buildBoneSegment, buildPlaceholderFemur } from './placeholderFemur.ts'

describe('buildBoneSegment', () => {
  const segment = buildBoneSegment({
    outerRadius: 10,
    innerRadius: 5,
    yBottom: 2,
    yTop: 12,
    radialSegments: 16,
  })

  it('spans the requested height and radius', () => {
    segment.computeBoundingBox()
    const box = segment.boundingBox!
    expect(box.min.y).toBeCloseTo(2)
    expect(box.max.y).toBeCloseTo(12)
    expect(box.max.x).toBeCloseTo(10)
  })

  it('has every triangle wound to face the same way as its normals', () => {
    // If winding and normals disagree, the face is invisible or lit wrong.
    const pos = segment.getAttribute('position')
    const nrm = segment.getAttribute('normal')
    const index = segment.getIndex()!
    const [a, b, c, n, faceNormal] = [0, 0, 0, 0, 0].map(() => new Vector3())
    for (let i = 0; i < index.count; i += 3) {
      a.fromBufferAttribute(pos, index.getX(i))
      b.fromBufferAttribute(pos, index.getX(i + 1))
      c.fromBufferAttribute(pos, index.getX(i + 2))
      n.fromBufferAttribute(nrm, index.getX(i))
      faceNormal.subVectors(c, b).cross(a.clone().sub(b))
      expect(faceNormal.dot(n)).toBeGreaterThan(0)
    }
  })
})

describe('placeholder femur', () => {
  it('leaves the fracture gap centred on y = 0', () => {
    const [proximal, distal] = buildPlaceholderFemur()
    const minY = (p: Float32Array) => Math.min(...p.filter((_, i) => i % 3 === 1))
    const maxY = (p: Float32Array) => Math.max(...p.filter((_, i) => i % 3 === 1))
    const half = FEMUR_PLACEHOLDER.fractureGapMm / 2
    expect(minY(proximal.positions)).toBeCloseTo(half)
    expect(maxY(distal.positions)).toBeCloseTo(-half)
  })

  it('committed femur.glb loads with three.js GLTFLoader (the loader drei uses)', async () => {
    const file = readFileSync(resolve(import.meta.dirname, '../public/models/femur.glb'))
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
    const gltf = await new GLTFLoader().parseAsync(buffer, '')
    const meshes: Mesh[] = []
    gltf.scene.traverse((o) => {
      if (o instanceof Mesh) meshes.push(o)
    })
    expect(meshes.map((m) => m.name).sort()).toEqual(['distal', 'proximal'])
    const size = new Box3().setFromObject(gltf.scene).getSize(new Vector3())
    expect(size.y).toBeCloseTo(
      2 * FEMUR_PLACEHOLDER.segmentLengthMm + FEMUR_PLACEHOLDER.fractureGapMm,
    )
  })
})
