# Harness log

One entry per harness round (`pnpm harness`, see `.claude/skills/harness/SKILL.md`): what failed, the root cause, and the fix.

## Round 1: RED (1 of 17 e2e tests)

- **Failed:** `F2 A/B views side by side with synced cameras`: left and right views not pixel-identical.
- **Review:** saved both crops and diffed them. All differences sat in one column: x = 615, the last column of crop A, over its full height.
- **Root cause:** the test was wrong, not the app. Panel A has a 1 px right border (the divider between the views), and crop A included it while crop B did not.
- **Fix:** `e2e/app.ts` `viewClips`: both crops stop 1 px short of the panel width, so they cover the same part of each scene. The check stays strict (exact pixel equality).

## Round 2: GREEN

- All 17 e2e tests and the static gate passed.
- **Self-review after green:** a probe with every axe rule found what the blocking checks did not: `region` (moderate), where the timeline sits outside any landmark, and 39 "incomplete" colour-contrast results that axe cannot measure (SVG chart text). Decision: make the harness catch both.

## Round 3: GREEN, but a false green

- **What happened:** the stricter tests were meant to fail, but they did not run. My scripted edit to `e2e/audit.spec.ts` searched for text Prettier had already reformatted, so it matched nothing and the old, looser test ran.
- **Root cause:** a no-op edit, plus a harness that only knew whether the tests it saw passed, not whether the required tests ran at all.
- **Fix:** rewrote `e2e/audit.spec.ts` in full (axe now blocks on moderate or worse; new contrast check that also covers SVG fill), and added a **harness self-check** to `scripts/harness.ts`: a list of required checks (F1–F7 and each audit) that must appear in the Playwright report, otherwise the round is red.

## Round 4: RED (lint, typecheck, build)

- **Failed:** `missingChecks` and `ranE2e` declared but never used.
- **Root cause:** another scripted insert matched the first `const failures` (inside `e2eFailures`) instead of the top-level one, so the self-check was defined but never called. The harness caught my own mistake.
- **Fix:** read the whole file, removed the duplicated block, and confirmed the self-check runs in the failure list.

## Round 5: RED (format, 2 audits). Loop limit reached

- **Failed:**
  - `format`: this log file was not Prettier-formatted.
  - axe `region` (moderate): the timeline is outside every landmark.
  - contrast: chart tick labels `#94a3b8` on white = 2.56:1 (needs 4.5:1).
  - contrast: the play button's "▶" reported as 1.00:1.
- **Review of the "▶" result:** a false positive from the checker itself. Tailwind v4 writes colours as `oklch()`, which the checker's `rgb()` parser could not read, so it fell back to white. The same bug silently **skipped** every text coloured in `oklch()`, so the check was missing real problems too.
- **Loop limit:** the skill allows 5 rounds per loop run. Every round found something new (no repeats), so this run closes here and a new run starts at round 6 with the fixes below.
- **Fixes for round 6:**
  - checker: convert any CSS colour through a 1×1 canvas (`e2e/audit.spec.ts`).
  - `src/charts/MetricChart.tsx`: tick text uses slate-600 `#475569` (7.6:1); axis lines stay light.
  - `src/ui/Timeline.tsx`: the timeline is a `<section aria-label="時間軸">` landmark.

## Round 6: GREEN (new loop run)

- Static gate and all 18 e2e tests passed, with the contrast checker now reading `oklch()` colours.

## Self-test of the harness (`pnpm harness:selftest`)

- **Why:** a green run only means something if the checks can fail. Round 3 showed a check can silently stop working.
- **How:** plant one known bug at a time, rebuild, run the test that should catch it, restore the file. A planted bug the harness misses is a blind spot. A mutation whose pattern no longer matches the code is reported as stale instead of passing.
- **Result:** 5 of 5 planted bugs caught:
  - low-contrast ticks → contrast audit
  - views not sharing the camera → F2
  - disclaimer wording → F7
  - timeline landmark removed → axe audit
  - chart click not jumping → F5
