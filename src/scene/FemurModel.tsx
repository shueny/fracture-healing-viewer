import { useGLTF } from '@react-three/drei'

// BASE_URL keeps the path right if the site is served from a sub-path.
export const FEMUR_URL = `${import.meta.env.BASE_URL}models/femur.glb`

export function FemurModel() {
  const { scene } = useGLTF(FEMUR_URL)
  return <primitive object={scene} />
}

useGLTF.preload(FEMUR_URL)
