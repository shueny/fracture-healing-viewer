// Writes src/data/scenarios.json. Runs before every build (pnpm build).
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildScenarios } from '../src/data/generateScenarios.ts'

const outPath = resolve(import.meta.dirname, '../src/data/scenarios.json')
writeFileSync(outPath, JSON.stringify(buildScenarios(), null, 2) + '\n')
console.log(`wrote ${outPath}`)
