# 0008 Nail and locking screws

Date: 2026-10-09 · Status: accepted

## Context

The PRD asks for a `CylinderGeometry` nail whose diameter follows the scenario (10 / 11 mm), with two locking screws above and two below the fracture. Three details were open: screw direction, whether implants are cut by the section plane, and sizes.

## Options and decisions (owner)

1. **Screw direction.** Medial-lateral (along X) vs anterior-posterior (along Z).
   Chosen: medial-lateral. It is the common direction for femoral nail locking, and the screws lie in the coronal section plane, so the cut shows each screw across the cortex.
2. **Cut the implants?** Cut with a metal-coloured cap vs keep them whole (half would stick out of the cut).
   Chosen: cut with cap. The whole picture stays one consistent cross-section, and the 10 vs 11 mm difference can be measured on the cut.
3. **Sizes** (illustrative): nail 360 mm centred on the fracture, screws Ø 5 mm × 40 mm at ±140 and ±165 mm. Constants in `src/scene/nailDimensions.ts`.

## Consequences

- The nail is a cylinder of diameter 1 scaled by the chosen diameter. A diameter change updates one scale value and builds no geometry (performance rule 9).
- Bone and metal need different cap colours, so section rendering now has layers (`SECTION_LAYERS`). Each layer runs stencil → cap → surface before the next starts. Where a screw passes through the cortex, the metal cap is drawn over the bone cap.
- The diameter is a prop fixed at 10 mm until the Day 3 scenario controls set it.
- Re-check the sizes when the real BodyParts3D femur replaces the placeholder (canal width, bone length).
