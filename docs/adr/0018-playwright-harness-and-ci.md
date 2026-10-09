# 0018 Playwright harness with self-review, self-test and CI

Date: 2026-10-09 · Status: accepted (owner request)

## Context

The owner asked to turn the manual browser checks into Playwright tests that run in CI, and for a harness that reviews itself, finds problems and repeats fixing them.

## Decision

- **Tests** (`e2e/`, Playwright 1.56.1, the version that matches the Chromium build available locally):
  - `features.spec.ts`: PRD F1–F7 through the real UI. F2 compares the A and B pixels with both views on the same scenario.
  - `audit.spec.ts`: self-review. axe (WCAG 2 A/AA + best practices, fails on moderate or worse), a contrast check that also covers SVG text and any CSS colour format, no console errors in a full session, one screen without scrolling at 1280/1440/1920, named controls, download budget (JS ≤ 500 KB gzip, GLB ≤ 2 MB).
- **Runner** `pnpm harness` (`scripts/harness.ts`): static gate + e2e, then `harness-report/SUMMARY.md` with each failure and where to look. It also self-checks that every required test actually ran, so a renamed or skipped test cannot produce a false green.
- **Fix loop** `.claude/skills/harness/SKILL.md`: run → review each failure (reproduce, name the root cause, app or test?) → smallest fix → log in `docs/HARNESS_LOG.md` → repeat, at most 5 rounds per run. Never weaken a check to get green; product decisions go to the owner.
- **Self-test** `pnpm harness:selftest` (`scripts/harnessSelftest.ts`): plants known bugs and checks that each one is caught.
- **CI:** a second job `e2e` installs Chromium and runs `pnpm e2e`; the HTML report is uploaded as an artifact.

## Options considered

- Keep the scratch scripts outside the repo: no CI, nothing for reviewers to rerun.
- Visual snapshot testing (golden screenshots): brittle with a software renderer and needs baseline management. The A-vs-B pixel comparison gives the same confidence for camera sync without baselines.
- Auto-fixing in CI with an AI agent: needs an API key secret and gives a bot write access. The fix loop runs in a Claude Code session instead, where the owner sees each round.

## Consequences

- WebGL runs on SwiftShader in CI: one worker, 90 s timeout per test; the e2e job takes about 2 minutes.
- Performance targets (60 fps, < 3 s load, < 100 ms switch) are still not measurable in CI.
- The self-test is slow (one build per planted bug), so it runs on demand.
