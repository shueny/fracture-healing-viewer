# 0003 Test runner: Vitest

Date: 2026-10-09 · Status: accepted

## Context

The quality gate needs unit tests for the data generator, the model pipeline and later the store logic.

## Options

1. Vitest: shares Vite's config and TypeScript/ESM handling, Jest-like API.
2. Jest: most widely known, but needs extra setup (ts-jest or Babel) for TypeScript + ESM in a Vite project.

## Decision

Vitest (owner). Configured in the `test` block of `vite.config.ts`.

## Consequences

One config file for build and tests. Tests run in a Node environment; 3D rendering itself is checked by eye or with a browser screenshot, not in unit tests.
