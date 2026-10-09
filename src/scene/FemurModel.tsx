import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { Mesh, type BufferGeometry, type Material } from 'three'
import { SectionCap, SectionedMesh } from './Section'

// BASE_URL keeps the path right if the site is served from a sub-path.
export const FEMUR_URL = `${import.meta.env.BASE_URL}models/femur.glb`

// Cut-surface colour: a little darker than the outer bone so the section reads.
const CAP_COLOR = '#c9bb98'

export function FemurModel() {
  const { scene } = useGLTF(FEMUR_URL)
  const meshes = useMemo(() => {
    // Each mesh in femur.glb has exactly one material.
    const found: Mesh<BufferGeometry, Material>[] = []
    scene.traverse((o) => {
      if (o instanceof Mesh && !Array.isArray(o.material)) found.push(o)
    })
    return found
  }, [scene])

  return (
    <>
      {meshes.map((m) => (
        <SectionedMesh key={m.uuid} geometry={m.geometry} material={m.material} />
      ))}
      {/* One cap covers both bone segments; sized to the whole model. */}
      <SectionCap width={200} height={600} color={CAP_COLOR} />
    </>
  )
}

useGLTF.preload(FEMUR_URL)
