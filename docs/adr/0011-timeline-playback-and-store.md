# 0011 Timeline playback and shared store

Date: 2026-10-09 · Status: accepted

## Context

The PRD asks for a week 0–20 slider with play/pause, keyboard control (space, left/right), and a Zustand store holding the current week and play state.

## Options (playback, owner decision)

1. Continuous: the week is a decimal number while playing, 20 weeks in 10 s. Dragging and keys snap to whole weeks. Chart values are interpolated between weeks.
2. Step: jump one whole week every 0.5 s.

## Decision

Option 1 (owner). Zustand as specified in the PRD.

## Implementation

- `src/store/timeline.ts`: pure maths (advance, step, clamp, label), unit-tested.
- `useViewerStore`: `week`, `playing`, `setWeek`, `step`, `togglePlay`, `tick`.
- `usePlayback`: a `requestAnimationFrame` loop that advances by real elapsed time, so the speed does not depend on frame rate.
- Choices made in the details: dragging or stepping pauses playback; play stops at week 20; pressing play at week 20 restarts from 0; the label shows the whole week reached (`floor`).

## Consequences

3D and charts read the same `week`, so they always agree. The scene re-renders the callus props on each frame while playing. If profiling shows this costs frames, the callus can subscribe to the store outside React (`useViewerStore.subscribe`) and set the uniform directly.
