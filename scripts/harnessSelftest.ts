// Harness self-test (ADR 0018): does the harness actually catch bugs?
// Plants one known bug at a time (a "mutation"), rebuilds, runs the test that
// should catch it, and restores the file. A mutation that the test does NOT
// catch means the harness has a blind spot. Run: pnpm harness:selftest
//
// Slow (a build per mutation), so it runs on demand, not on every PR.

import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

interface Mutation {
  bug: string
  file: string
  find: string
  replace: string
  test: string // Playwright test title (grep) that must now fail
}

const MUTATIONS: Mutation[] = [
  {
    bug: 'chart tick labels back to low contrast',
    file: 'src/charts/MetricChart.tsx',
    find: "const TICK = { fill: '#475569'",
    replace: "const TICK = { fill: '#94a3b8'",
    test: 'audit: all visible text meets WCAG AA contrast',
  },
  {
    bug: 'views stop sharing the camera pose',
    file: 'src/scene/SyncedControls.tsx',
    find: '    if (!controls.current) return\n    const { setCamera }',
    replace: '    if (controls.current) return\n    const { setCamera }',
    test: 'F2 ',
  },
  {
    bug: 'disclaimer wording changed',
    file: 'src/ui/copy.ts',
    find: "export const DISCLAIMER = '示意模型，非醫療數據，不作臨床用途'",
    replace: "export const DISCLAIMER = '示意模型'",
    test: 'F7 ',
  },
  {
    bug: 'timeline loses its landmark',
    file: 'src/ui/Timeline.tsx',
    find: 'aria-label="時間軸"',
    replace: 'data-x="時間軸"',
    test: 'audit: no accessibility violations',
  },
  {
    bug: 'chart click no longer jumps to the week',
    file: 'src/charts/MetricChart.tsx',
    find: 'if (clicked !== null) setWeek(clicked)',
    replace: 'if (clicked === -1) setWeek(clicked)',
    test: 'F5 ',
  },
]

const run = (cmd: string) => spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8' })
const rows: string[] = []
let blindSpots = 0

for (const m of MUTATIONS) {
  const path = join(root, m.file)
  const original = readFileSync(path, 'utf8')
  // A mutation that no longer matches the code would "pass" without testing
  // anything, so that is an error of its own.
  if (!original.includes(m.find)) {
    rows.push(`| ${m.bug} | STALE: pattern not found in ${m.file} | - |`)
    blindSpots++
    continue
  }
  try {
    writeFileSync(path, original.replace(m.find, m.replace))
    const build = run('pnpm exec vite build --logLevel error')
    if (build.status !== 0) throw new Error(`build failed:\n${build.stderr}`)
    const t = run(`pnpm exec playwright test --reporter=line -g "${m.test}"`)
    const caught = t.status !== 0
    if (!caught) blindSpots++
    rows.push(`| ${m.bug} | ${caught ? 'caught' : 'MISSED'} | ${m.test.trim()} |`)
    console.log(`${caught ? 'caught' : 'MISSED'}  ${m.bug}`)
  } finally {
    writeFileSync(path, original)
  }
}

run('pnpm exec vite build --logLevel error') // leave dist/ matching the real code
const report = [
  `# Harness self-test: ${blindSpots ? `${blindSpots} blind spot(s)` : 'every planted bug caught'}`,
  '',
  '| planted bug | result | test |',
  '|---|---|---|',
  ...rows,
].join('\n')
writeFileSync(join(root, 'harness-report', 'SELFTEST.md'), report)
console.log(`\n${report}`)
process.exit(blindSpots ? 1 : 0)
