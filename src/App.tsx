import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { FemurModel } from './scene/FemurModel'
import { Nail } from './scene/Nail'

// Scene units are millimetres; the femur is about 400 mm long on the Y axis.
export default function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 700], fov: 35, near: 1, far: 5000 }}
      gl={{ stencil: true }} // the section cap needs a stencil buffer
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true // per-material clipping planes
      }}
    >
      <color attach="background" args={['#e9ebee']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[300, 400, 500]} intensity={1.6} />
      <Suspense fallback={null}>
        <FemurModel />
        {/* Fixed at 10 mm until scenario controls arrive (Day 3). */}
        <Nail diameterMm={10} />
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  )
}
