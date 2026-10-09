# 0014 Per-view scenario controls

Date: 2026-10-09 · Status: proposed (UI detail, owner may change)

## Context

PRD F4: each view picks nail diameter (10 / 11 mm) and loading (partial / full). The PRD keeps A/B parameters in the Zustand store and places the controls under each view's label.

## Options

1. Segmented toggle buttons (all options visible, one click to switch).
2. Dropdowns (`<select>`): compact, but two clicks and the current value is less visible.

## Decision

Segmented buttons, in the view's scenario colour for the selected option. Marked up as `radiogroup` / `radio` with `aria-checked` so screen readers announce them correctly.

## Consequences

- `scenarios` and `setScenario(slot, change)` live in the store; a change keeps the week and the other view untouched.
- A switch only changes the nail scale and the callus uniform (no geometry rebuild, no new shader), so it costs about one extra frame.
