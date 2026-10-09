import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type { ScenarioParams } from './data/healingModel'
import { FractureScene } from './scene/FractureScene'
import { Timeline } from './ui/Timeline'

// Default scenario A (owner). Scenario controls and view B arrive on Day 3.
const SCENARIO_A: ScenarioParams = { nailDiameterMm: 11, loading: 'partial' }

// Scene units are millimetres; the femur is about 400 mm long on the Y axis.
export default function App() {
  return (
    <div className="flex h-full flex-col bg-slate-100">
      <div className="min-h-0 flex-1">
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
          <FractureScene scenario={SCENARIO_A} />
          <OrbitControls makeDefault />
        </Canvas>
      </div>
      <Timeline />
    </div>
  )
}
