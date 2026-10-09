# 0013 A/B views and camera sync

Date: 2026-10-09 · Status: one canvas = PRD decision; sync mechanism proposed (owner may change)

## Context

The PRD chose one `Canvas` with drei `View` (one WebGL context, assets load once) and says the two views share one set of camera parameters, kept in the Zustand store. How to share them is open.

## Options

1. **One camera object for both views.** Simplest, but two `OrbitControls` would fight over one camera (each keeps its own orbit target and calls `lookAt` with it every frame).
2. **One camera + one controls bound to the whole canvas.** Dragging anywhere moves both, but then each view cannot have its own mouse area, and the canvas must take pointer events away from the UI on top.
3. **A camera and controls per view, plus a shared pose in the store** (position + target + version). When the user drags in one view, that view writes the pose; every frame each view copies a newer pose into its own camera.

## Decision

Option 3. Each view's `OrbitControls` listens only on its own panel. `nextCameraPose` ignores changes below 1e-4 mm, so when view B copies view A's pose, B's controls report the same pose back and the version does not change. Without that check the two views would keep echoing each other.

## Consequences

- Damping is off, so both views stop moving at the same moment.
- The pose is read with `getState()` inside `useFrame`, not with a React subscription, so dragging does not re-render React.
- drei `View` clears colour and depth per view but not stencil. Our caps reset the stencil they use (ADR 0006), so views do not leak stencil values into each other.
- Panels are transparent and above the canvas (z-index), so labels and controls appear over the 3D image.
