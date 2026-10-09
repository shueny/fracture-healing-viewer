// Intramedullary nail and locking screws (illustrative sizes, mm). The nail
// follows the shaft centre line of the real femur, centred on the fracture
// line (y = 0); screw positions and lengths come from femur.json (ADR 0019).

export { NAIL_DIAMETERS_MM, type NailDiameterMm } from '../data/healingModel'

export const NAIL = {
  lengthMm: 360,
  radialSegments: 48,
} as const

export const LOCKING_SCREW = {
  diameterMm: 5,
} as const
