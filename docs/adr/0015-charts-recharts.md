# 0015 Charts: Recharts

Date: 2026-10-09 · Status: accepted

## Context

PRD F5: three line charts (IFM, implant stress, consolidation), A and B lines, a cursor synced with the timeline, click to jump to a week. The PRD leaves "Recharts or visx" open.

## Options

1. Recharts: declarative components (`<LineChart><Line/>`), built-in tooltip, reference lines and click events. Less control, bigger bundle.
2. visx: low-level D3 scales + SVG pieces; full control and smaller, but cursor, click, axes and tooltip must be assembled by hand (2–3× more code).

## Decision

Recharts 3 (owner).

## Consequences

- Each chart takes rows `{ week, A, B }` built by `buildChartRows` from the same JSON the 3D uses, so 3D and charts always agree.
- Chart style follows the dataviz rules: 2 px lines, no dots, recessive axes and grid, one y axis per chart, a legend with line keys, and a crosshair tooltip that lists both scenarios at that week. The A/B colours pass the palette validator (CVD ΔE 31.7, contrast ≥ 3:1).
- Animation is off; motion comes from the timeline only.
- The JS bundle grows by about 120 KB gzip (now about 455 KB gzip). Re-check the "first load < 3 s" target at deploy time; code-splitting is the fallback.
