// Intramedullary nail and locking screws (illustrative sizes, mm). The nail
// sits on the shaft axis, centred on the fracture line (y = 0).

export const NAIL_DIAMETERS_MM = [10, 11] as const
export type NailDiameterMm = (typeof NAIL_DIAMETERS_MM)[number]

export const NAIL = {
  lengthMm: 360,
  radialSegments: 48,
} as const

// Two screws above and two below the fracture, medial-lateral (along X).
export const LOCKING_SCREW = {
  diameterMm: 5,
  lengthMm: 40,
  offsetsMm: [-165, -140, 140, 165],
} as const

// The nail mesh is a cylinder of diameter 1. Scaling X and Z by the diameter
// resizes it without building new geometry (performance rule 9).
export function nailScale(diameterMm: number): [number, number, number] {
  return [diameterMm, 1, diameterMm]
}
