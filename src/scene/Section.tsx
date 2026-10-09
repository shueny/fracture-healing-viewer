import { useMemo } from 'react'
import type { BufferGeometry, Material } from 'three'
import {
  SECTION_PLANE,
  STENCIL_SIDES,
  createCapMaterial,
  createStencilMaterial,
  sectionRenderOrder,
  type SectionLayer,
} from './sectionMaterials'

interface SectionedMeshProps {
  geometry: BufferGeometry
  material: Material
  layer: SectionLayer
}

// A closed mesh cut by the section plane: two stencil passes + the visible,
// clipped surface. All three share the same geometry (no copies).
export function SectionedMesh({ geometry, material, layer }: SectionedMeshProps) {
  const order = sectionRenderOrder(layer)
  const stencilMaterials = useMemo(() => STENCIL_SIDES.map((s) => createStencilMaterial(s)), [])
  const surfaceMaterial = useMemo(() => {
    const m = material.clone()
    m.clippingPlanes = [SECTION_PLANE]
    return m
  }, [material])

  return (
    <>
      {stencilMaterials.map((m) => (
        <mesh key={m.side} geometry={geometry} material={m} renderOrder={order.stencil} />
      ))}
      <mesh geometry={geometry} material={surfaceMaterial} renderOrder={order.surface} />
    </>
  )
}

interface SectionCapProps {
  width: number
  height: number
  color: string
  layer: SectionLayer
}

// Flat quad lying on the section plane, facing the removed (camera) side.
// Caps every SectionedMesh of the same layer.
export function SectionCap({ width, height, color, layer }: SectionCapProps) {
  const material = useMemo(() => createCapMaterial(color), [color])
  return (
    <mesh material={material} renderOrder={sectionRenderOrder(layer).cap}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}
