import {
  BackSide,
  DecrementWrapStencilOp,
  FrontSide,
  IncrementWrapStencilOp,
  NotEqualStencilFunc,
  ReplaceStencilOp,
  Vector3,
} from 'three'
import { describe, expect, it } from 'vitest'
import {
  SECTION_LAYERS,
  SECTION_PLANE,
  createCapMaterial,
  createStencilMaterial,
  sectionRenderOrder,
} from './sectionMaterials'

describe('SECTION_PLANE', () => {
  // three.js keeps points with distance >= 0 and clips the rest.
  it('keeps the back half (z < 0) and removes the front half facing the camera', () => {
    expect(SECTION_PLANE.distanceToPoint(new Vector3(0, 0, -5))).toBeGreaterThan(0)
    expect(SECTION_PLANE.distanceToPoint(new Vector3(0, 0, 5))).toBeLessThan(0)
  })

  it('contains the whole shaft axis (coronal plane through x = z = 0)', () => {
    for (const y of [-200, 0, 200]) {
      expect(SECTION_PLANE.distanceToPoint(new Vector3(0, y, 0))).toBe(0)
    }
  })
})

describe('stencil materials', () => {
  it('back faces add 1 and front faces subtract 1, invisibly and without depth test', () => {
    const back = createStencilMaterial(BackSide)
    const front = createStencilMaterial(FrontSide)
    expect(back.stencilZPass).toBe(IncrementWrapStencilOp)
    expect(back.stencilZFail).toBe(IncrementWrapStencilOp)
    expect(front.stencilZPass).toBe(DecrementWrapStencilOp)
    expect(front.stencilZFail).toBe(DecrementWrapStencilOp)
    for (const m of [back, front]) {
      expect(m.colorWrite).toBe(false)
      expect(m.depthTest).toBe(false)
      expect(m.clippingPlanes).toEqual([SECTION_PLANE])
    }
  })

  it('cap draws only where stencil != 0 and resets those pixels to 0', () => {
    const cap = createCapMaterial('#ffffff')
    expect(cap.stencilFunc).toBe(NotEqualStencilFunc)
    expect(cap.stencilRef).toBe(0)
    expect(cap.stencilZPass).toBe(ReplaceStencilOp)
    expect(cap.stencilZFail).toBe(ReplaceStencilOp)
    expect(cap.clippingPlanes ?? []).toHaveLength(0) // the cap lies on the plane
  })

  it('draws stencil passes before the cap, and the cap before the surface', () => {
    const order = sectionRenderOrder(SECTION_LAYERS.bone)
    expect(order.stencil).toBeLessThan(order.cap)
    expect(order.cap).toBeLessThan(order.surface)
  })

  it('finishes the bone layer before the implant layer starts', () => {
    const bone = sectionRenderOrder(SECTION_LAYERS.bone)
    const implant = sectionRenderOrder(SECTION_LAYERS.implant)
    expect(Math.max(...Object.values(bone))).toBeLessThan(Math.min(...Object.values(implant)))
  })
})
