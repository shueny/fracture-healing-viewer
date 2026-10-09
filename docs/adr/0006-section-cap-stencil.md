# 0006 Section cap: stencil buffer

Date: 2026-10-09 · Status: accepted

## Context

A clipping plane removes half of the bone, but a mesh is only a surface: the cut would show a thin hollow shell. The cut face needs a solid "cap".

## Options

1. Stencil cap (as in the PRD): count back faces (+1) and front faces (-1) in the stencil buffer, then draw a flat quad on the plane only where the count is non-zero.
2. Back-face fill: paint the mesh's back faces in a flat unlit colour so the inside looks filled. Less code, no stencil, but not a real plane (flat colour only), and it departs from the PRD.

## Decision

Option 1 (owner). Code in `src/scene/sectionMaterials.ts` and `src/scene/Section.tsx`.

## Consequences

- The renderer needs `stencil: true` and `localClippingEnabled = true`.
- Every capped mesh must be closed (watertight); the real Blender femur must be too.
- Draw order matters: stencil passes → cap → visible surface (`sectionRenderOrder`; per-material layers added in ADR 0008).
- The cap resets its pixels to 0, so the stencil is clean for the next object or view. Check this again when Day 3 adds two drei `View`s that share one canvas.
- Each capped mesh costs two extra draw calls (stencil passes). Fine for a few meshes.
