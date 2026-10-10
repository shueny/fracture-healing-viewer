import { useMemo } from 'react'
import type { BufferGeometry, Material } from 'three'
import {
  RENDER_ORDER,
  SECTION_PLANE,
  STENCIL_SIDES,
  createCapMaterial,
  createStencilMaterial,
} from './sectionMaterials'

interface SectionedMeshProps {
  geometry: BufferGeometry
  material: Material
}

// A closed mesh cut by the section plane: two stencil passes + the visible,
// clipped surface. All three share the same geometry (no copies).
export function SectionedMesh({ geometry, material }: SectionedMeshProps) {
  const stencilMaterials = useMemo(() => STENCIL_SIDES.map((s) => createStencilMaterial(s)), [])
  const surfaceMaterial = useMemo(() => {
    const m = material.clone()
    m.clippingPlanes = [SECTION_PLANE]
    return m
  }, [material])

  return (
    <>
      {stencilMaterials.map((m) => (
        <mesh key={m.side} geometry={geometry} material={m} renderOrder={RENDER_ORDER.stencil} />
      ))}
      <mesh geometry={geometry} material={surfaceMaterial} renderOrder={RENDER_ORDER.surface} />
    </>
  )
}

interface SectionCapProps {
  width: number
  height: number
  color: string
}

// Flat quad lying on the section plane, facing the removed (camera) side.
// Must be drawn after every SectionedMesh it caps.
export function SectionCap({ width, height, color }: SectionCapProps) {
  const material = useMemo(() => createCapMaterial(color), [color])
  return (
    <mesh material={material} renderOrder={RENDER_ORDER.cap}>
      <planeGeometry args={[width, height]} />
    </mesh>
  )
}
