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
