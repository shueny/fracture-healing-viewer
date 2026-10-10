# 0016 Deploy on Vercel, CI on GitHub Actions

Date: 2026-10-09 · Status: accepted

## Context

The PRD needs a public URL and leaves "Vercel or GitHub Pages" open. The owner also approved a CI check (not in the PRD).

## Options

1. Vercel: preview URL for every PR, zero config for Vite; the owner connects the repo with her account.
2. GitHub Pages via Actions: everything in the repo, but a sub-path (`/fracture-healing-viewer/`) and no PR previews.

## Decision

Vercel (owner). `vercel.json` pins framework, install, build and output, and caches `/models/*` for a day. Setup steps are in `docs/DEPLOY.md`. CI (owner): `.github/workflows/ci.yml` runs `pnpm check` on every PR and on pushes to `main`.

## Consequences

- The site is served from `/`, so `BASE_URL` stays `/`; the model path already uses `BASE_URL`, so a move to Pages later only needs `base` in `vite.config.ts`.
- Node 22.18+ is required in both CI and Vercel, because the build runs `.ts` scripts directly.
- Connecting Vercel needs the owner's account; it cannot be done from this repo alone.
