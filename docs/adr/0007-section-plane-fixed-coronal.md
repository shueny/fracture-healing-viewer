# 0007 Section plane: fixed coronal plane

Date: 2026-10-09 · Status: accepted

## Context

The section needs a plane. It can stay fixed in the world or follow the camera.

## Options

1. Fixed coronal plane through the shaft axis (z = 0), front half removed. Like an AP X-ray view, familiar to surgeons.
2. Plane always facing the camera: the inside is visible from any angle, but the cut direction keeps changing, it is not a standard anatomical section, and the plane must be updated every frame.

## Decision

Option 1 (owner). `SECTION_PLANE = Plane((0, 0, -1), 0)`.

## Consequences

Rotating to the back shows the intact outer surface. The default camera looks along -Z at the cut. The same plane will clip the nail and callus later.
