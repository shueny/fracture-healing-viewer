# 0017 Initial camera framed on the fracture

Date: 2026-10-09 · Status: accepted (owner request: "鏡頭拉近到骨折處")

## Context

The first camera showed the whole 400 mm femur. At 1280 px each view is about 540 px wide, so the 50 mm callus, the part that changes over time, was only a small blob.

## Decision

Start centred on the fracture line, framing 60 mm above and below it: the whole callus (±25 mm) plus some intact bone. The distance is computed, not guessed: `distance = halfHeight / tan(fov / 2)` = 60 / tan(17.5°) ≈ 190 mm (`framingDistance` in `src/store/cameraPose.ts`).

## Consequences

- The locking screws (±140–165 mm) are off screen at start; zooming out with the mouse wheel shows them, in both views together.
- If the field of view changes, the framing still holds because the distance is derived from it.
