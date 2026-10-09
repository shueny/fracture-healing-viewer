// Sizes of the placeholder femur (ADR 0005), mm. Shared by the generator
// script and the app (callus fits around this bone, the nail inside it).
export const FEMUR_PLACEHOLDER = {
  outerRadiusMm: 13.5, // ~27 mm shaft diameter
  canalRadiusMm: 6.5, // 13 mm canal, room for the 10 / 11 mm nail
  segmentLengthMm: 200,
  fractureGapMm: 3,
  radialSegments: 64,
} as const
