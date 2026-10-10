// Harness runner (ADR 0018): runs every check, then writes a summary an agent
// (or a person) can act on. Run: pnpm harness
//
//   harness-report/SUMMARY.md     what failed this round and where to look
//   harness-report/summary.json   the same, machine-readable
//   harness-report/history.jsonl  one line per round, to see progress
//
// Exit code 0 only when everything passes.

import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const out = join(root, 'harness-report')
mkdirSync(out, { recursive: true })

interface Step {
  name: string
  command: string
  ok: boolean
  seconds: number
  tail: string
}
interface Failure {
  step: string
  test: string
  message: string
}

const STEPS: [string, string][] = [
  ['lint', 'pnpm lint'],
  ['format', 'pnpm format:check'],
  ['typecheck', 'pnpm typecheck'],
  ['unit', 'pnpm test'],
  ['build', 'pnpm build'],
  ['e2e', 'pnpm exec playwright test'],
]

const steps: Step[] = []
for (const [name, command] of STEPS) {
  const t0 = Date.now()
  const r = spawnSync(command, { cwd: root, shell: true, encoding: 'utf8', env: process.env })
  const output = `${r.stdout ?? ''}${r.stderr ?? ''}`
  steps.push({
    name,
    command,
    ok: r.status === 0,
    seconds: Math.round((Date.now() - t0) / 100) / 10,
    tail: output.split('\n').slice(-30).join('\n'),
  })
  console.log(`${r.status === 0 ? 'PASS' : 'FAIL'}  ${name.padEnd(10)} ${command}`)
  // e2e needs a fresh build; without one its results would be misleading.
  if (name === 'build' && r.status !== 0) break
}

// Pull individual failing e2e tests out of Playwright's JSON report.
interface PwSuite {
  title: string
  specs?: {
    title: string
    tests: { results: { status: string; error?: { message?: string } }[] }[]
  }[]
  suites?: PwSuite[]
}
function e2eFailures(): Failure[] {
  const file = join(out, 'e2e.json')
  if (!existsSync(file)) return []
  const failures: Failure[] = []
  const walk = (suite: PwSuite) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        const last = t.results[t.results.length - 1]
        if (last && last.status !== 'passed' && last.status !== 'skipped') {
          // Strip terminal colour codes (ESC [ ... m) from Playwright's message.
          const message = (last.error?.message ?? last.status).replace(
            new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g'),
            '',
          )
          failures.push({
            step: 'e2e',
            test: `${suite.title} › ${spec.title}`,
            message: message.slice(0, 1200),
          })
        }
      }
    }
    for (const s of suite.suites ?? []) walk(s)
  }
  for (const s of (JSON.parse(readFileSync(file, 'utf8')).suites ?? []) as PwSuite[]) walk(s)
  return failures
}

// Self-check of the harness itself: every required check must have run.
// A test that was renamed, deleted or never executed would otherwise leave a
// silent gap and a false green.
const REQUIRED_E2E = [
  'F1 ',
  'F2 ',
  'F3 ',
  'F4 ',
  'F5 ',
  'F6 ',
  'F7 ',
  'audit: no accessibility violations',
  'audit: all visible text meets WCAG AA contrast',
  'audit: no console errors',
  'audit: one screen without scrolling at 1280x800',
  'audit: every control can be reached',
  'audit: download budget',
]
function missingChecks(): Failure[] {
  const file = join(out, 'e2e.json')
  if (!existsSync(file))
    return [{ step: 'e2e', test: 'harness self-check', message: 'no e2e report found' }]
  const titles: string[] = []
  const walk = (suite: PwSuite) => {
    for (const spec of suite.specs ?? [])
      if (spec.tests.some((t) => t.results.length)) titles.push(spec.title)
    for (const s of suite.suites ?? []) walk(s)
  }
  for (const s of (JSON.parse(readFileSync(file, 'utf8')).suites ?? []) as PwSuite[]) walk(s)
  return REQUIRED_E2E.filter((r) => !titles.some((t) => t.startsWith(r))).map((r) => ({
    step: 'e2e',
    test: 'harness self-check',
    message: `required check "${r.trim()}" did not run (renamed, deleted or skipped?)`,
  }))
}

const ranE2e = steps.some((s) => s.name === 'e2e')

const failures: Failure[] = [
  ...steps
    .filter((s) => !s.ok && s.name !== 'e2e')
    .map((s) => ({ step: s.name, test: s.command, message: s.tail })),
  ...(steps.find((s) => s.name === 'e2e' && !s.ok) ? e2eFailures() : []),
  ...(ranE2e ? missingChecks() : []),
]
const historyFile = join(out, 'history.jsonl')
const round =
  (existsSync(historyFile)
    ? readFileSync(historyFile, 'utf8').trim().split('\n').filter(Boolean).length
    : 0) + 1
const green = steps.length === STEPS.length && steps.every((s) => s.ok) && failures.length === 0
const summary = { round, green, at: new Date().toISOString(), steps, failures }

writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2))
appendFileSync(
  historyFile,
  JSON.stringify({ round, green, at: summary.at, failed: failures.map((f) => f.test) }) + '\n',
)
writeFileSync(
  join(out, 'SUMMARY.md'),
  [
    `# Harness round ${round}: ${green ? 'GREEN' : 'RED'}`,
    '',
    '| step | result | seconds |',
    '|---|---|---|',
    ...steps.map((s) => `| ${s.name} | ${s.ok ? 'pass' : 'FAIL'} | ${s.seconds} |`),
    '',
    failures.length ? `## ${failures.length} failure(s)` : '## No failures',
    ...failures.flatMap((f) => ['', `### [${f.step}] ${f.test}`, '```', f.message.trim(), '```']),
    '',
    'Details: harness-report/html/index.html (Playwright report with screenshots and traces).',
  ].join('\n'),
)
console.log(
  `\nRound ${round}: ${green ? 'GREEN' : `RED, ${failures.length} failure(s)`} -> harness-report/SUMMARY.md`,
)
process.exit(green ? 0 : 1)
