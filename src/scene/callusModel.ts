// Callus growth and tissue state (ADR 0009). The GLSL in src/shaders/tissue.glsl
// is a line-by-line copy of these functions; tests run on this TypeScript
// version, so change both together.

import { NAIL_DIAMETERS_MM } from './nailDimensions'

export const CALLUS = {
  halfLengthMm: 25, // callus reaches 25 mm above and below the fracture line
  maxThicknessMm: 6, // periosteal bulge at the fracture line
  boneOffsetMm: 0.05, // sits just outside the bone surface (no z-fighting)
  profileSteps: 32,
  radialSegments: 96,
} as const

// Fibrous -> cartilage -> woven bone -> mature bone. Chosen to stay clear of
// the scenario colours (A blue, B orange).
export const TISSUES = [
  { key: 'fibrous', label: '纖維組織', color: '#d9607a' },
  { key: 'cartilage', label: '軟骨', color: '#9b7fd1' },
  { key: 'woven', label: '編織骨', color: '#e2c04f' },
  { key: 'mature', label: '成熟骨', color: '#e3d3a3' },
] as const

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}

// c = consolidation 0..1. Size grows over the first half of healing ...
export const callusGrowth = (c: number) => smoothstep(0, 0.5, c)
// ... and the outer bulge shrinks by up to 35 % as it remodels near the end.
export const callusRemodel = (c: number) => 1 - 0.35 * smoothstep(0.7, 1, c)

// d = distance from the fracture line, 0 (line) .. 1 (callus end).
// Outer parts mature first; the fracture line matures last (owner formula).
export const callusMaturity = (c: number, d: number) => clamp01(1.6 * c - 0.6 * (1 - d))

// Four bands with a soft edge of +/-0.05 maturity around each boundary.
export const TISSUE_EDGE = 0.05
export function tissueIndex(maturity: number): number {
  return Math.min(3, Math.floor(maturity * 4))
}

// The nail must never poke through the gap callus.
export const GAP_CALLUS_INNER_RADIUS_MIN_MM = Math.max(...NAIL_DIAMETERS_MM) / 2
