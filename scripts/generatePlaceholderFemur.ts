// Writes public/models/femur.glb. Run: pnpm gen:placeholder-femur
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { encodeGlb } from './glb.ts'
import { buildPlaceholderFemur } from './placeholderFemur.ts'

const outPath = resolve(import.meta.dirname, '../public/models/femur.glb')
const glb = encodeGlb(buildPlaceholderFemur(), {
  name: 'bone',
  baseColor: [0.87, 0.84, 0.76, 1],
})
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, glb)
console.log(`wrote ${outPath} (${(glb.length / 1024).toFixed(1)} KB)`)
