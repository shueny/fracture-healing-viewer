---
name: harness
description: Run the project's verification harness (lint, types, unit tests, build, Playwright features F1-F7 and self-review audit), then fix what it finds and run again until green. Use when asked to verify, "run the harness", check a change end to end, or before declaring any ticket done.
---

# Harness loop: run, review, fix, repeat

The harness is the project's feedback loop (ADR 0018). It checks the PRD features like a user would and audits the page like a reviewer would. Your job is to drive it to green without cheating.

## Loop (at most 5 rounds)

1. **Run** `pnpm harness`. It prints PASS/FAIL per step and writes `harness-report/SUMMARY.md`.
2. **Read** `harness-report/SUMMARY.md`. Green: go to "Finish". Red: continue.
3. **Review each failure** before touching code:
   - Reproduce it on its own (`pnpm exec playwright test -g "<test name>"`, or the single failing command).
   - Open `harness-report/html/index.html` or the failure screenshot / trace when the message is not enough.
   - Name the root cause in one sentence. Is the app wrong, or is the test wrong?
4. **Fix the root cause** with the smallest change.
   - The app is wrong: fix the app.
   - The test is wrong (it checks something the PRD does not ask for, or it is flaky by design): fix the test and say why in the log. Never delete a check, skip it, or loosen a threshold just to get green.
   - The fix needs a product decision (library, data model, design, scope): stop and ask the owner (CLAUDE.md rule 2).
5. **Log the round** in `docs/HARNESS_LOG.md`: round number, what failed, root cause, fix, file(s) changed.
6. Go to step 1.

If round 5 is still red, stop and report what is left, with the root causes you found.

## Finish

- Run `pnpm check` once more and paste its output (CLAUDE.md rule 6).
- Commit the fixes with the log entry; one commit per round is fine.

## What the harness checks

| step                                 | what                                                                                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| lint, format, typecheck, unit, build | the static quality gate (`pnpm check`)                                                                                                                                           |
| `e2e/features.spec.ts`               | PRD F1-F7 driven through the real UI (F2 compares the A and B pixels)                                                                                                            |
| `e2e/audit.spec.ts`                  | self-review: axe WCAG 2 AA (no serious/critical), no console errors in a full session, one screen without scrolling at 1280/1440/1920, every control has a name, download budget |
