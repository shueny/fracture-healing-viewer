# 0010 Styling: Tailwind CSS

Date: 2026-10-09 · Status: accepted

## Context

The PRD leaves open "CSS Modules or Tailwind". The UI is a single screen with panels, controls, a timeline and charts.

## Options

1. CSS Modules: built into Vite, plain CSS per component, no extra package.
2. Tailwind: utility classes in JSX, fast to lay out and consistent spacing/colours; one more package, longer class strings.

## Decision

Tailwind v4 (owner), via the `@tailwindcss/vite` plugin and `@import 'tailwindcss'` in `src/index.css`. No config file is needed in v4.

## Consequences

Layout and UI styling live in `className`. Colours that the 3D scene and charts also need (scenario A/B, tissue colours) stay in TypeScript constants so there is one source for both.
