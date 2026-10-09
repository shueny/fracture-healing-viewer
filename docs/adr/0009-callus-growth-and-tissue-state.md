# 0009 Callus growth and tissue state

Date: 2026-10-09 · Status: accepted

## Context

The PRD asks for a callus around the fracture whose size and colour follow the week via a custom shader: each vertex picks its tissue state from its distance to the fracture line. Tissue state is not stored in JSON; it is computed from C(t). Three things were open: how distance affects tissue, how colours change, and how size changes.

## Options and decisions (owner)

1. **Tissue vs distance.** "Outer parts ossify first" vs "uniform with C(t)".
   Chosen: outer first. maturity = clamp(1.6·c − 0.6·(1 − d)), where c = C/100 and d = 0 at the fracture line, 1 at the callus end. Ossification moves from the callus ends toward the fracture line.
2. **Colour transition.** Four bands with a narrow blend (±0.05 maturity) vs a continuous gradient.
   Chosen: bands, so each region maps to one legend category.
3. **Size.** Grow, then remodel smaller vs grow and stay.
   Chosen: grow then remodel. growth = smoothstep(0, 0.5, c); the outer bulge shrinks by up to 35 % between c = 0.7 and 1.

## Implementation

- The geometry is a closed `LatheGeometry` built once at full size: a periosteal bulge (25 mm each side, 6 mm thick) plus a ring filling the 3 mm gap. The vertex shader shrinks it for the current week, so nothing is rebuilt (rule 9).
- The callus is its own section layer (bone → callus → implant). Its stencil passes use the same vertex shader, so the cap matches the shrunken shape. Its cap is a shader too, so the cut face shows tissue colours.
- One uniforms object is shared by all callus materials. A week change updates one number.
- The formulas live in `src/scene/callusModel.ts` (tested) and are copied line by line to `src/shaders/tissue.glsl`.

## Consequences

- Tissue colours: fibrous `#d9607a`, cartilage `#9b7fd1`, woven `#e2c04f`, mature `#e3d3a3`. They avoid the scenario colours (A blue, B orange). This changes the earlier "red-pink → blue-purple → orange → beige" draft: woven is yellow, not orange, and mature is a warmer cream so it stands out from the grey background.
- With these numbers the fracture line becomes mature bone at week 10 (normal healing) vs week 15 (delayed). A good candidate for the "bone bridging" milestone extension later.
- The GLSL and TypeScript copies must be changed together.
