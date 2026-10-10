// Extracts the BodyParts3D 4.0 right femur (FMA24474) from a local clone of
// github.com/ashemag/human-atlas (a CC BY 4.0 repack of BodyParts3D) and
// writes it as an OBJ in the official BodyParts3D convention: millimetres,
// Z up. Used because the official download site is not reachable from the
// build environment (ADR 0019). With the official FMA24474.obj, skip this
// step and pass that file to buildFemur.ts directly.
//
// Run: node scripts/extractFemurFromHumanAtlas.ts <human-atlas dir> [out.obj]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const [srcDir, outArg] = process.argv.slice(2)
if (!srcDir) throw new Error('usage: extractFemurFromHumanAtlas.ts <human-atlas dir> [out.obj]')
const out = resolve(outArg ?? join(import.meta.dirname, '../data/raw/FMA24474.obj'))

interface Part {
  conceptId: string
  name: string
  chunk: number
  positions: number
  indices: number
  vertexCount: number
  indexCount: number
}
const atlas = JSON.parse(readFileSync(join(srcDir, 'public/models/atlas.json'), 'utf8'))
const part: Part = atlas.parts.find((p: Part) => p.conceptId === 'FMA24474')
if (!part) throw new Error('FMA24474 (right femur) not found in atlas.json')

// Chunk layout (from the repack's loader): float32 xyz positions in metres,
// Y up; uint32 triangle indices.
const file = readFileSync(join(srcDir, `public/models/body-${part.chunk}.bin`))
const buf = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
const pos = new Float32Array(buf, part.positions, part.vertexCount * 3)
const idx = new Uint32Array(buf, part.indices, part.indexCount)

// Back to BodyParts3D convention: metres -> mm, Y up -> Z up (x, y, z) -> (x, -z, y).
const lines = [
  `# BodyParts3D 4.0, ${part.name} (${part.conceptId}), (c) The Database Center for Life Science, CC BY 4.0`,
  '# extracted from the github.com/ashemag/human-atlas repack; units mm, Z up',
]
for (let i = 0; i < pos.length; i += 3) {
  const [x, y, z] = [pos[i] * 1000, pos[i + 1] * 1000, pos[i + 2] * 1000]
  lines.push(`v ${x.toFixed(4)} ${(-z).toFixed(4)} ${y.toFixed(4)}`)
}
for (let i = 0; i < idx.length; i += 3)
  lines.push(`f ${idx[i] + 1} ${idx[i + 1] + 1} ${idx[i + 2] + 1}`)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, lines.join('\n') + '\n')
console.log(`wrote ${out}: ${part.vertexCount} vertices, ${part.indexCount / 3} triangles`)
