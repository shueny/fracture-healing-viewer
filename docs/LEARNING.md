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

## Day 3 · Ticket 2: A/B views with synced cameras

### What was built

- Two side-by-side 3D views, "方案 A" (blue) and "方案 B" (orange), both drawn by one canvas with drei `View`.
- Defaults (owner): A = 11 mm + partial loading, B = 10 mm + full loading (the delayed case).
- Rotating, panning or zooming in either view moves both the same way (ADR 0013).

### Key concepts in plain language

- **One canvas, two views.** A browser allows only a limited number of WebGL contexts, and each would load its own copy of the model. With `View`, one canvas covers the page; for each view it sets a _scissor_ rectangle (only this area may be drawn) and renders that view's scene there.
- **Scissor test.** Like masking tape on a wall: paint anywhere, only the untaped area changes.
- **Shared camera pose.** The store keeps "where the camera is and what it looks at". The view you drag writes it; every frame both views read it. A version number tells a view "this is newer than what you have".
- **Avoiding echo.** When B copies A's pose, B's controls report "I moved". Without a check, B would write the pose back, A would copy it again, and so on forever. The store ignores updates that do not really change the pose.

### Why it was done this way

- The PRD asks for one canvas and shared camera parameters in the store; per-view controls let each panel own its mouse area.

### Quiz

1. Why is one canvas with two `View`s better than two canvases here?
2. What would happen without the epsilon check in `nextCameraPose`?
3. Why does `SyncedControls` read the store with `getState()` in `useFrame` instead of `useViewerStore((s) => s.camera)`?

## Day 3 · Ticket 3: per-view scenario controls

### What was built

- Under each view's label: nail diameter (10 mm / 11 mm) and loading (部分負重 / 完全負重) toggle buttons, coloured with the view's scenario colour (ADR 0014).
- The A/B scenario parameters moved into the store (`scenarios`, `setScenario`). The 3D views read them from there.

### Key concepts in plain language

- **Single source of truth, again.** The buttons write to the store; the 3D views (and the charts on Day 4) read from it. Nobody keeps a private copy, so nothing can get out of sync.
- **Immutable update.** `setScenario` builds a new `scenarios` object instead of changing the old one. Zustand compares old and new by reference to know what changed, and React re-renders only what depends on it.
- **Accessible toggles.** `role="radiogroup"` and `aria-checked` tell assistive technology "one of these is selected", just like radio buttons.
- **Why switching is cheap.** A new diameter changes one scale; a new loading changes which JSON row feeds the callus uniform. No geometry is built and no shader is compiled.

### Quiz

1. When you click "完全負重" in view A, which store field changes, and which components re-render?
2. Why does `setScenario` spread the old objects (`...s.scenarios`, `...s.scenarios[slot]`)?
3. What work does the GPU _not_ have to do when you switch the nail diameter?

## Day 4 · Ticket 1: three metric charts

### What was built

- Three line charts under the timeline: 碎片間移動 (mm), 植入物應力 (MPa), 癒合程度 (%), each with a blue A line and an orange B line, a legend and a hover tooltip (ADR 0015).
- They read the same `scenarios.json` rows as the 3D views and follow the scenario controls.

### Key concepts in plain language

- **Data shape for charts.** Recharts wants one object per x value with a field per line: `{ week: 8, A: 78, B: 196 }`. `buildChartRows` turns two scenarios into that shape.
- **One axis per chart.** Each metric has its own unit, so each gets its own chart instead of two y axes on one (a classic way to mislead).
- **Colour carries identity, text stays neutral.** Lines are blue/orange; numbers in the tooltip stay dark grey and the name "方案 A" says which is which. That also helps colour-blind readers.
- **Reading the charts.** B (10 mm + full) starts with more movement (1.28 vs 0.64 mm) and higher implant stress, and consolidates more slowly: the delayed-healing story of ADR 0001.

### Quiz

1. Why does each chart have its own y axis instead of putting all three metrics in one chart?
2. Where do the chart values come from, and why can they never disagree with the 3D callus?
3. Why is B's implant stress higher than A's at week 0?

## Day 4 · Ticket 2: chart cursor synced with the timeline, click to jump

### What was built

- A dark vertical cursor in all three charts at the current week; it moves with the slider, the keys and playback.
- Clicking a chart jumps the whole app (3D, slider, other charts) to the week under the pointer.

### Key concepts in plain language

- **Two-way binding through the store.** The timeline writes `week`; the charts read it to draw the cursor. A chart click writes `week` too, and everything else follows. Nobody talks to anybody directly; they all talk to the store.
- **useMemo.** The chart rows depend only on the chosen scenarios, so they are computed once per scenario change, not 60 times a second during playback.
- **`activeLabel`.** Recharts tracks which data point is nearest the pointer; on click it reports that point's x value, which is our week.
- **Focus for keyboard users only.** `:focus-visible` shows the focus outline when you tab to a chart, not when you click it.

### Quiz

1. Trace what happens, store field by store field, when you click week 15 on the consolidation chart.
2. Why is `buildChartRows` wrapped in `useMemo`, and what are its dependencies?
3. Why does the cursor appear at the same x position in all three charts?

## Day 5 · Ticket 1: legend, case panel, disclaimer and page layout

### What was built

- The PRD one-screen layout: header (title + disclaimer), left sidebar (case info + tissue legend), A/B views, timeline, charts, footer.
- `Disclaimer`: "示意模型，非醫療數據，不作臨床用途" in the header, always visible (PRD F7), and again in the footer.
- `CasePanel`: the fixed demo case read from `scenarios.json` (PRD F1).
- `Legend`: the four tissue colours from the same constants the shader uses (PRD F6).
- Footer credit says the femur is a generated placeholder. It must not credit BodyParts3D until the real model replaces it (ADR 0005).

### Key concepts in plain language

- **Flexbox layout for "fill the rest".** Header, timeline, charts and footer take their natural height; the 3D area is `flex-1` and gets whatever is left, so the page never scrolls.
- **`min-h-0` / `min-w-0`.** By default a flex child refuses to shrink below its content. These let the 3D canvas and charts shrink to fit.
- **One source for shared constants.** The legend and the shader read the same `TISSUES`; the disclaimer text lives in `copy.ts` and a test checks the exact wording.
- **Semantic HTML.** `<header>`, `<main>`, `<aside>`, `<footer>`, `<dl>` for key/value pairs, `role="note"` for the disclaimer: screen readers and search engines understand the page structure.

### Quiz

1. Why does the 3D area use `flex-1 min-h-0`, and what happens without `min-h-0`?
2. Where do the legend colours come from, and why not hard-code them in the legend?
3. Why does the footer not mention BodyParts3D yet?

## Day 5 · Ticket 2: deployment setup and CI

### What was built

- `vercel.json` and `docs/DEPLOY.md`: Vercel builds the site from GitHub (ADR 0016). The owner connects the repo once.
- `.github/workflows/ci.yml`: GitHub Actions runs `pnpm check` on every PR and push to `main`.

### Key concepts in plain language

- **Static site.** `pnpm build` produces plain files (HTML, JS, CSS, the GLB). Any web server can host them; there is no backend.
- **CI (continuous integration).** A fresh machine runs the same quality gate as you do locally, so a PR shows a green tick or a red cross before anyone merges.
- **`--frozen-lockfile`.** Install exactly the versions in `pnpm-lock.yaml`; fail if `package.json` and the lockfile disagree. Builds are reproducible.
- **Preview deployments.** Vercel builds every PR to its own URL, so reviewers can click instead of checking out code.

### Quiz

1. What does CI run, and what does a red cross on a PR tell you?
2. Why does the install use `--frozen-lockfile`?
3. Which Node version does the build need, and why?

## Day 5 · Ticket 3: README and licence

### What was built

- `README.md`: what the viewer does, screenshots, the technical decision table with ADR links, the data model, how to run it, the folder layout, data sources and licences.
- `LICENSE`: MIT for the code. The femur model will carry its own CC BY-SA 2.1 JP licence once the BodyParts3D model replaces the placeholder.

### Key concepts in plain language

- **Code licence vs asset licence.** MIT covers our code. A 3D model can have a different licence; CC BY-SA means "credit the source and share changes under the same licence".
- **README as the 2-minute pitch.** The first readers are engineering leads with little time: screenshot first, then what it does, then why it was built this way.

### Quiz

1. Which licence applies to the code, and which would apply to a modified BodyParts3D femur?
2. Name three technical decisions from the README table and the reason for each.
3. Why does the README say the femur is a placeholder?

## Follow-up: camera starts close on the fracture

### What was built

- The default camera is centred on the fracture line and frames ±60 mm, so the callus fills the view (ADR 0017). Zoom out with the wheel to see the nail and screws.
- README screenshots updated: default close-up, and a zoomed-out view with the nail and screws.

### Key concepts in plain language

- **Framing with trigonometry.** A camera with a 35° vertical field of view sees `2 · distance · tan(17.5°)` of height at the target. Solving for distance gives where to put the camera to show a chosen height.

### Quiz

1. How far is the camera from the fracture at start, and how is that number computed?
2. What do you do to see the locking screws, and why do both views follow?
3. If the field of view became 50°, would the callus still be framed the same? Why?
