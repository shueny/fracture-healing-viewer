# 0012 How scenarios.json is produced and loaded

Date: 2026-10-09 · Status: proposed (implementation detail, owner may change)

## Context

The PRD says `generateScenarios.ts` produces `scenarios.json` at build time and the app reads it ("預先計算", like a real product where simulation runs elsewhere). Two details are not specified: whether the JSON is committed, and whether it is bundled or fetched.

## Options

1. **Commit the JSON and regenerate on every build** (`pnpm build` runs `pnpm gen:scenarios` first). A test fails if the committed file differs from the formulas.
2. Do not commit it; generate only during build. Cleaner git, but tests and `pnpm dev` need an extra step and reviewers cannot see the data in PRs.
3. Bundle the JSON with a static `import` (~20 KB, parsed with the app) vs `fetch` it at startup (a separate request and a loading state).

## Decision

Option 1 with a static import. The data is tiny, and seeing it in PR diffs helps review. Values are rounded (IFM 3 decimals, stress and consolidation 1 decimal).

## Consequences

- The 3D scene now takes C(t) from the JSON (linear interpolation between weeks), not from the formulas, so 3D and charts show the same numbers.
- Changing a formula means running `pnpm gen:scenarios` (or `pnpm build`) and committing the new JSON; the test catches it if forgotten.
- `generateScenarios.ts` and `healingModel.ts` use explicit `.ts` imports so Node can run them without a build step.
