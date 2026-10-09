import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, type ComponentRef } from 'react'
import { INITIAL_CAMERA, type Vec3 } from '../store/cameraPose'
import { useViewerStore } from '../store/useViewerStore'

// Camera + orbit controls for one view, kept in sync with the other view
// through the shared pose in the store:
// - when the user drags here, write this camera's pose to the store;
// - every frame, if the store's pose is newer than what we applied, copy it.
export function SyncedControls({ domElement }: { domElement: HTMLElement }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const camera = useThree((s) => s.camera)
  const appliedVersion = useRef(-1)

  useFrame(() => {
    const pose = useViewerStore.getState().camera
    if (!controls.current || pose.version === appliedVersion.current) return
    appliedVersion.current = pose.version
    camera.position.fromArray(pose.position)
    controls.current.target.fromArray(pose.target)
    controls.current.update()
  })

  const publish = () => {
    if (!controls.current) return
    const { setCamera } = useViewerStore.getState()
    setCamera(camera.position.toArray() as Vec3, controls.current.target.toArray() as Vec3)
  }

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={INITIAL_CAMERA.position}
        fov={35}
        near={1}
        far={5000}
      />
      <OrbitControls
        ref={controls}
        domElement={domElement}
        enableDamping={false} // no drift after release: both views stop together
        onChange={publish}
      />
    </>
  )
}
