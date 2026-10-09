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

## Day 1 · Ticket 3: intramedullary nail and locking screws

### What was built

- A titanium-coloured nail on the shaft axis, 360 mm long, centred on the fracture. Its diameter (10 or 11 mm) comes from a prop.
- Four medial-lateral locking screws (Ø 5 mm × 40 mm), two in each fragment.
- Nail and screws are cut by the same coronal plane, with a grey metal cap (ADR 0008).
- Section rendering now supports layers, so bone and metal each get their own cap colour.

### Key concepts in plain language

- **Scale instead of rebuild.** The nail is built once as a cylinder 1 mm wide. To make it 10 or 11 mm wide, we stretch it in X and Z. Changing a scale is one number on the GPU; building new geometry means new vertex buffers. That is why switching scenarios can stay under 100 ms.
- **Layers in the stencil cap.** One stencil buffer can only answer "is this pixel inside _something_?", not "inside what?". So we finish the bone completely (stencil → cap → surface, which also resets the stencil to 0) before starting the metal. Draw order is controlled by `renderOrder`: bone uses 1–3, implants 11–13.
- **Overlap.** A screw passes through the cortex. The bone cap paints those pixels first, then the metal layer paints its cap on top at the same depth, so metal wins.

### Why it was done this way

- Medial-lateral screws are the usual distal locking direction, and they lie in our coronal cut, so they are visible.
- Cutting the implants keeps one honest cross-section. A whole nail would stick out of the cut face.
- The sizes live in one constants file and tests check them against the bone: both nails fit the canal, the nail spans the gap, and every screw goes through the nail and both cortices.

### Quiz

1. Why does the nail use a scale of `[d, 1, d]` instead of `new CylinderGeometry(d / 2, ...)` when the diameter changes?
2. What would the cut look like if bone and metal shared one stencil pass and one cap?
3. Why are the locking screws visible along their full length in our section, and what would change with anterior-posterior screws?

## Day 2 · Ticket 1: callus shader

### What was built

- `src/data/healingModel.ts`: the PRD formulas (IFM, consolidation, implant stress, delay threshold) with tests.
- A callus around the fracture: a bulge outside the bone plus a ring filling the gap. It grows, ossifies from the ends toward the fracture line, and remodels at the end (ADR 0009).
- GLSL shaders in `src/shaders/`: surface, stencil pass and cut-face cap, sharing `tissue.glsl`.

### Key concepts in plain language

- **Vertex shader vs fragment shader.** The vertex shader runs once per corner and decides _where_ it is; ours squeezes the full-size callus toward the bone for early weeks. The fragment shader runs once per pixel and decides _what colour_ it is; ours turns maturity into a tissue colour.
- **Uniform.** A value sent from JavaScript to the shader that is the same for every vertex and pixel, here `uConsolidation`. Changing it costs almost nothing, which is why the callus never needs new geometry.
- **Varying.** A value the vertex shader hands to the fragment shader, blended across the triangle. `vDistance` carries "how far from the fracture line" to each pixel.
- **Lathe geometry.** Draw a 2D outline and spin it around an axis, like a potter's wheel.
- **Why the stencil passes need the callus shader too.** The stencil counts the shape that is actually drawn. If it counted the full-size callus, the cap would be too big in early weeks.
- **Signed volume test.** Adding up tiny tetrahedra from the origin to every triangle gives the volume. It is positive only if all faces point outward, which is a simple way to prove the mesh is closed and oriented correctly.

### Why it was done this way

- The PRD keeps tissue state out of the JSON and computes it from C(t) and distance, so the shader does it live.
- The formulas exist in TypeScript too, so they can be unit-tested (shaders cannot run in Vitest), and the legend can reuse the colours.

### Quiz

1. Which number changes when the week changes, and why does that keep scenario switching under 100 ms?
2. Why does the outer callus turn into bone before the fracture line, and in which week does the line become mature bone in the normal vs delayed scenario?
3. Why does the cut-face cap divide `y` by the growth factor before computing the distance?

## Day 2 · Ticket 2: timeline with play / pause

### What was built

- A timeline bar: play/pause button, week slider (0–20) and "第 N 週 / 20" label. Space bar plays/pauses, left/right arrows move one week.
- A Zustand store (`useViewerStore`) with the current week and play state, shared by the 3D scene now and the charts later.
- Tailwind CSS for the UI (ADR 0010). The scene now shows the default scenario A (11 mm + partial) and follows the week (ADR 0011).

### Key concepts in plain language

- **Store.** One shared box of state outside the component tree. Any component can read from it (`useViewerStore((s) => s.week)`) and re-renders only when that value changes. This is how the 3D views and charts stay in sync without passing props everywhere.
- **requestAnimationFrame.** The browser calls our function once before each screen refresh. We measure the real time since the last call and move the week forward by that much, so playback takes 10 s on a 60 Hz or a 144 Hz screen alike.
- **Pure functions first.** The timeline rules (how far to move, where to step) are plain functions without React, so they are easy to test. The React hooks only wire them to the browser.
- **Controlled input.** The slider shows `week` from the store and reports changes back. The store is the single source of truth.

### Why it was done this way

- Continuous playback makes the callus grow smoothly; whole-week steps for dragging and keys match how a clinician thinks ("week 8").
- Dragging pauses playback so the user is never fighting the animation.

### Quiz

1. Why does playback multiply by elapsed seconds instead of adding a fixed amount per frame?
2. Where does the "current week" live, and which parts of the app read it?
3. What happens when you press play at week 20, and why?

## Day 3 · Ticket 1: generateScenarios.ts and scenarios.json

### What was built

- `src/data/generateScenarios.ts` turns the PRD formulas into 4 scenarios × 21 weeks, in the PRD's JSON shape.
- `scripts/writeScenarios.ts` writes `src/data/scenarios.json`; `pnpm build` runs it first.
- `src/data/scenarios.ts` reads the JSON: `getScenario(params)` and `valueAt(scenario, metric, week)` with linear interpolation.
- The callus now gets C(t) from the JSON (ADR 0012).

### Key concepts in plain language

- **Precompute vs compute live.** In a real product the heavy simulation runs on a server or offline and the browser only displays results. We copy that split: formulas run once at build time; the app reads numbers.
- **Linear interpolation.** Between week 8 and 9 the value is a straight-line blend: at 8.5 it is halfway. This keeps playback smooth with only 21 stored points per scenario.
- **Golden-file test.** A test regenerates the data and compares it to the committed file, so the file can never silently drift from the formulas.

### Why it was done this way

- One function builds the data; one function reads it. The 3D scene and the charts (Day 4) both use `valueAt`, so they can never disagree.

### Quiz

1. Why does the app read `scenarios.json` instead of calling the formulas directly?
2. What is `valueAt(s, 'consolidationPct', 8.25)` in terms of the stored week 8 and week 9 values?
3. What fails if someone changes a formula but forgets to regenerate the JSON?
