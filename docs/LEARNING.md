# Learning log

## Day 1 · Ticket 1: project setup and loading femur.glb

### What was built

- A Vite + React + TypeScript project with React Three Fiber (R3F) and drei.
- A placeholder femur: two hollow tubes (outer Ø 27 mm, canal Ø 13 mm, 200 mm each) with a 3 mm fracture gap at y = 0, saved as `public/models/femur.glb`.
- A page that loads the GLB with drei's `useGLTF` and lets you rotate and zoom with `OrbitControls`.
- Quality gate: `pnpm check` runs lint, format check, type check, tests and build.

### Key concepts in plain language

- **GLB** is the binary form of glTF, the "JPEG of 3D". One file holds a JSON description (meshes, materials) and one binary block (the raw numbers). Our writer builds both chunks and pads each to a multiple of 4 bytes, as the spec requires.
- **Mesh = vertices + triangles.** Each vertex has a position and a normal (the direction the surface faces, used for lighting). Triangles are three vertex indices.
- **Winding order.** The GPU decides which side of a triangle is the front from the order of its three corners (counter-clockwise = front). To make the canal wall face inward, we reverse the order of every triangle and flip its normals. A test checks that every triangle's winding agrees with its normal.
- **Suspense.** `useGLTF` "pauses" the component until the file has loaded; `<Suspense>` decides what to show meanwhile.
- **Units.** One scene unit = 1 mm, so later numbers (nail Ø 10/11 mm, gap 3 mm) can be used directly.

### Why it was done this way

- The real model needs manual Blender work. A placeholder with the same units and axes lets the rest of Day 1 continue, and the real file can replace it without code changes (ADR 0005).
- The GLB writer is ~100 lines and has no dependency, so every byte of the file can be explained.
- The test loads the committed GLB with three.js `GLTFLoader`, the same loader `useGLTF` uses, so "the file loads" is proven, not assumed.

### Quiz

1. Why does the inner canal wall need its triangles reversed, and what would you see if they were not?
2. What are the two chunks inside a GLB file, and why are they padded to 4 bytes?
3. Which properties must the real Blender femur keep so it can replace the placeholder without code changes?

## Day 1 · Ticket 2: section clipping and stencil cap

### What was built

- A fixed coronal clipping plane through the shaft axis that removes the front half of the bone (ADR 0007).
- A solid "cap" on the cut face drawn with the stencil buffer, so the cortex reads as solid bone and the canal stays open (ADR 0006).
- Reusable pieces: `SectionedMesh` (any closed mesh that should be cut) and `SectionCap` (the quad on the plane).

### Key concepts in plain language

- **Clipping plane.** A plane is a normal plus an offset. For every pixel, three.js computes `normal · position + constant`; negative means "cut away". Our normal points to -Z, so everything in front (z > 0) is removed.
- **Why a cap is needed.** A 3D mesh is only a skin. Cut it and you look into an empty shell.
- **Stencil buffer.** An extra per-pixel counter next to the colour and depth buffers. You can write to it without drawing colour, and later draw only where it has a certain value. It works like a stencil you paint through.
- **The counting trick.** Shoot a ray from the eye through a pixel. Every time it crosses into the bone it passes a front face, every time it leaves it passes a back face. After clipping, a pixel where the ray starts _inside_ solid bone at the plane has one more back face than front face, so back (+1) and front (-1) do not cancel and the counter is non-zero. In the canal or outside the bone they cancel to 0. The cap draws only on non-zero pixels.
- **Render order.** The GPU draws in sequence, so the stencil must be filled before the cap reads it: stencil → cap → visible surface.

### Why it was done this way

- The PRD chose clipping + stencil cap over transparency: transparency has sorting problems and hides the inside. A cross-section is the view surgeons know.
- All three meshes per bone segment reuse the same geometry, so nothing is copied or rebuilt (performance rule 9).
- The cap writes 0 back where it draws, so the stencil buffer is clean afterwards. That will matter when two views share one canvas on Day 3.

### Quiz

1. Why does the counter stay at 0 inside the medullary canal but not inside the cortical wall?
2. Why do the stencil passes turn off depth testing?
3. What would go wrong if the visible bone surface were drawn before the stencil passes?
