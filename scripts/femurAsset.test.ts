import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Box3, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { describe, expect, it } from 'vitest'
import femur from '../src/data/femur.json' with { type: 'json' }
import { holeEdges, signedVolume } from '../src/test/meshChecks.ts'

async function loadFemur() {
  const file = readFileSync(resolve(import.meta.dirname, '../public/models/femur.glb'))
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  const gltf = await new GLTFLoader().parseAsync(buffer, '')
  const meshes: Mesh[] = []
  gltf.scene.traverse((o) => {
    if (o instanceof Mesh) meshes.push(o)
  })
  return meshes
}

describe('committed femur.glb (real BodyParts3D femur)', () => {
  it('loads with three.js GLTFLoader (the loader drei uses) as two fragments', async () => {
    const meshes = await loadFemur()
    expect(meshes.map((m) => m.name).sort()).toEqual(['distal', 'proximal'])
  })

  it('each fragment is closed (no holes) and outward, so the section cap works', async () => {
    for (const m of await loadFemur()) {
      expect(holeEdges(m.geometry)).toBe(0)
      expect(signedVolume(m.geometry)).toBeGreaterThan(0)
    }
  })

  it('has the 3 mm fracture gap centred on y = 0 and the measured length', async () => {
    const meshes = await loadFemur()
    const box = (name: string) => new Box3().setFromObject(meshes.find((m) => m.name === name)!)
    expect(box('proximal').min.y).toBeCloseTo(1.5, 1)
    expect(box('distal').max.y).toBeCloseTo(-1.5, 1)
    const all = new Box3().setFromObject(meshes[0]).union(new Box3().setFromObject(meshes[1]))
    expect(all.getSize(new Vector3()).y).toBeCloseTo(femur.lengthMm, 0)
  })

  it('stays within the 2 MB model budget', () => {
    const size = readFileSync(resolve(import.meta.dirname, '../public/models/femur.glb')).length
    expect(size).toBeLessThan(2 * 1024 * 1024)
  })
})
