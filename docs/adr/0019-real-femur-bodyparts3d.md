# 0019 Real BodyParts3D femur, scripted pipeline, curved nail

Date: 2026-10-09 · Status: accepted (owner) · Supersedes ADR 0005

## Context

The owner asked for a real bone model instead of the generated tubes. The PRD names the BodyParts3D right femur (FMA24474) and manual Blender steps. The official download site is not reachable from the build environment (network policy).

## Decisions (owner)

1. **Source.** Use the BodyParts3D 4.0 right femur from the CC BY 4.0 repack in `github.com/ashemag/human-atlas` now; swap in the official `FMA24474.obj` later by rerunning the same pipeline.
   - The repack states the official licence is now CC BY 4.0 (updated 2025-02-27), replacing the CC BY-SA 2.1 JP named in older files and in the PRD. Not verifiable from here because the official site is blocked; check when the official file is fetched.
   - The repacked mesh is simplified: 930 triangles, 467 unique vertices.
2. **Processing:** a Node script with **manifold-3d** (build-time only, not in the web bundle). Its boolean operations always return closed meshes, which the stencil section cap needs.
3. **Surface:** smooth + subdivide (`refine(4)`, 930 → ~30 000 triangles across both fragments; GLB 720 KB, under the 2 MB budget).
4. **Nail along the bowed shaft.** The femur bows forward (about 15 mm). A straight 360 mm canal broke through the cortex beyond +115 / −170 mm (960 mm³), so canal and nail now follow the measured shaft centre line.
5. **Section stays coronal** (ADR 0007). Near the fracture (about ±75 mm) the cut shows the nail. Further out, the bowed nail and the screws lie behind the plane and are covered by the bone cap, like a real AP slice.

## Pipeline (`pnpm build:femur`, `scripts/buildFemur.ts`)

weld → smooth + subdivide → shaft axis onto Z, mid-length on the origin → centre line = cubic fit of slice centroids every 5 mm → canal Ø 13 mm swept along it (checked: 0 mm³ outside the bone) → 3 mm gap → two fragments → measurements → Z-up to Y-up → `public/models/femur.glb` + `src/data/femur.json`.

`femur.json` carries what the app needs from the real bone:

- the centre line
- 33 callus cross-sections × 96 angles, so the callus hugs the real, non-round shaft
- the four screw centres and lengths (40–53 mm, the bone width at each height + 3 mm per side)

## Consequences

- The callus is no longer a lathe around a circle. `callusGeometry.ts` builds it from the measured cross-sections, and the shader shrinks it toward per-vertex bone-surface points (`aBase`, `aExternal`) instead of a radius uniform.
- The nail is a closed tube along the centre line. Both diameters are built once and a switch toggles visibility, so performance rule 9 still holds.
- Raw sources stay out of git (`data/raw/`, `*.obj`); the GLB and `femur.json` are committed, so CI does not need the source.
- Tests check that the GLB loads, has no holes, is outward-facing, has the 3 mm gap at y = 0, and stays within the budget, and that the callus and nail meshes are closed.
- The proximal fragment touches itself along a few edges near the trochanter (edges shared 4–6 times). It has no holes, so the stencil count stays correct.
- Page footer and README credit BodyParts3D, CC BY 4.0, "modified". The PRD still names CC BY-SA 2.1 JP; the owner should update it if she agrees.
