# 0002 Package manager: pnpm

Date: 2026-10-09 · Status: accepted

## Context

The project needs one package manager for installs, scripts and the lockfile.

## Options

1. pnpm: fast, strict (a package cannot import what it did not declare), saves disk space through a shared store. Same tool as the owner's other project.
2. npm: comes with Node and needs no setup, but is slower and less strict.

## Decision

pnpm (owner), pinned with `packageManager` in `package.json`.

## Consequences

Contributors need pnpm (or `corepack enable`). pnpm 10 blocks dependency install scripts by default, so `esbuild` (used by Vite) is allowed explicitly in `pnpm.onlyBuiltDependencies`.
