// Section view: one fixed clipping plane plus a stencil "cap" that fills the
// cut so the bone reads as solid instead of a hollow shell.
//
// How the cap works (classic stencil capping):
// 1. Draw the clipped mesh's BACK faces into the stencil buffer only, +1 each.
// 2. Draw its FRONT faces the same way, -1 each.
//    Along any pixel ray, a point inside solid bone has passed one more back
//    face than front face, so its stencil value is non-zero. Outside the
//    bone, or inside the empty canal, the faces pair up and it stays 0.
// 3. Draw a flat cap quad on the plane only where stencil != 0, and reset
//    those pixels to 0 so the next draw starts clean.

import {
  AlwaysStencilFunc,
  BackSide,
  DecrementWrapStencilOp,
  FrontSide,
  IncrementWrapStencilOp,
  MeshBasicMaterial,
  NotEqualStencilFunc,
  Plane,
  ReplaceStencilOp,
  Vector3,
  type Material,
  type Side,
} from 'three'

// Coronal plane through the shaft axis (z = 0). three.js keeps the side where
// normal · p + constant >= 0, so normal -Z keeps z <= 0 and removes the
// front half that faces the default camera.
export const SECTION_PLANE = new Plane(new Vector3(0, 0, -1), 0)

// Each material that needs its own cap colour (bone, metal) is a "layer".
// Layers are drawn one after another, each as stencil -> cap -> surface, so a
// layer's cap only sees its own stencil counts. The cap resets the stencil to
// 0, so the next layer starts clean. Where solids overlap (a screw through the
// cortex) the later layer's cap is drawn on top.
export const SECTION_LAYERS = { bone: 0, callus: 1, implant: 2 } as const
export type SectionLayer = (typeof SECTION_LAYERS)[keyof typeof SECTION_LAYERS]

// Draw order inside one frame (lower first).
export function sectionRenderOrder(layer: SectionLayer) {
  const base = layer * 10
  return { stencil: base + 1, cap: base + 2, surface: base + 3 }
}

// Turns any material into a stencil-counting pass (no colour, no depth).
// Used directly for custom shader materials such as the callus.
export function makeStencilPass<M extends Material>(material: M, side: Side): M {
  const op = side === BackSide ? IncrementWrapStencilOp : DecrementWrapStencilOp
  material.side = side
  material.colorWrite = false // stencil only, nothing visible
  material.depthWrite = false
  material.depthTest = false // count every face along the ray, even hidden ones
  material.stencilWrite = true
  material.stencilFunc = AlwaysStencilFunc
  material.stencilFail = op
  material.stencilZFail = op
  material.stencilZPass = op
  return material
}

export function createStencilMaterial(side: Side, plane: Plane = SECTION_PLANE) {
  return makeStencilPass(new MeshBasicMaterial({ clippingPlanes: [plane] }), side)
}

// Turns any material into a cap: drawn only where the stencil count is
// non-zero, and writes 0 back so the stencil is clean afterwards.
export function makeCapPass<M extends Material>(material: M): M {
  material.stencilWrite = true
  material.stencilRef = 0
  material.stencilFunc = NotEqualStencilFunc // only inside the solid
  material.stencilFail = ReplaceStencilOp
  material.stencilZFail = ReplaceStencilOp
  material.stencilZPass = ReplaceStencilOp // write 0 back
  return material
}

export function createCapMaterial(color: string) {
  return makeCapPass(new MeshBasicMaterial({ color }))
}

export const STENCIL_SIDES = [BackSide, FrontSide] as const
