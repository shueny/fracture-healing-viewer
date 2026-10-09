# fracture-healing-viewer

The product spec is [docs/PRD.md](docs/PRD.md). It is the single source of truth. Read it fully before writing code. When the PRD and your own judgement disagree, stop and ask the owner.

## Rules

The owner will be interviewed about every decision in this project. Code she cannot explain is worse than no code.

1. **Work ticket by ticket.** Do the checklist items in the PRD schedule (Day 1 to Day 5) in order. One task per branch and per PR-sized change. Do not start the next task until the owner confirms the current one.
2. **Decisions belong to the owner.** When a task has a real choice (library, data model, algorithm, folder structure not specified in the PRD, or any open question listed in the PRD), present 2 or 3 options with trade-offs and a recommendation, then wait. Do not pick silently.
3. **Write an ADR for every decision** in `docs/adr/NNNN-title.md` (context, options, decision, consequences). Short is fine.
4. **Explain after each task.** Append to `docs/LEARNING.md`: what was built, the key concepts in plain language, why it was done this way, and 3 quiz questions the owner should be able to answer.
5. **No silent scope growth.** If you see a useful addition, propose it in your reply. Do not add it. Extension features in the PRD wait until the MVP is done.
6. **Quality gate before declaring a task done:** lint, type check, tests and production build all pass. Paste the command output in your reply. The exact commands are set when the project is scaffolded (Day 1) and must be listed in the "Commands" section below.
7. **Illustrative data only.** All numbers come from the PRD formulas via `generateScenarios.ts`. Never present them as medical data. The disclaimer "示意模型，非醫療數據，不作臨床用途" must stay visible on the page.
8. **License and credit.** The femur model is BodyParts3D (© The Database Center for Life Science, CC BY-SA 2.1 Japan). Keep the credit on the page footer and in the README. Commit only the processed `public/models/femur.glb`; keep raw sources (`*.obj`, `*.blend`) out of git.
9. **Performance budget.** Do not rebuild geometry on week or scenario changes; update shader uniforms only. Target about 60 fps on desktop Chrome, first load under 3 s, scenario switch under 100 ms.

## Repo layout

See the directory structure in the PRD (`src/scene`, `src/shaders`, `src/charts`, `src/ui`, `src/store`, `src/data`, `public/models`).

| folder | what |
|---|---|
| `src/` | Vite + React + TypeScript app |
| `public/models/` | processed glb models |
| `docs/` | PRD, ADRs, LEARNING.md |

## Commands

To be filled in when the project is scaffolded (Day 1): install, dev server, lint, type check, test, build.
