# 0004 Lint and formatting: ESLint + Prettier

Date: 2026-10-09 · Status: accepted

## Context

The quality gate needs a linter (finds bugs) and a formatter (one code style).

## Options

1. ESLint + Prettier: the Vite template already ships ESLint with React Hooks rules; Prettier handles formatting. Two tools.
2. Biome: one fast tool for both, less config, but fewer React-specific rules.

## Decision

ESLint + Prettier (owner). `eslint-config-prettier` turns off ESLint rules that would fight Prettier.

## Consequences

`pnpm lint` and `pnpm format:check` are both in `pnpm check`. Browser globals for `src/`, Node globals for `scripts/` and config files.
