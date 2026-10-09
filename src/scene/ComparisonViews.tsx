import { View } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState, type ReactNode } from 'react'
import { useViewerStore } from '../store/useViewerStore'
import { FractureScene } from './FractureScene'
import { SCENARIO_COLORS, type ScenarioSlot } from './scenarioColors'
import { SyncedControls } from './SyncedControls'

interface ComparisonViewsProps {
  // UI drawn on top of each view (controls), per slot.
  overlay?: (slot: ScenarioSlot) => ReactNode
}

const SLOTS: ScenarioSlot[] = ['A', 'B']

// Two side-by-side 3D views drawn by ONE canvas (PRD): drei <View> renders
// each scene into the screen area of its tracking <div> with a scissor test.
// One WebGL context, so the femur model and materials load once.
export function ComparisonViews({ overlay }: ComparisonViewsProps) {
  const scenarios = useViewerStore((s) => s.scenarios)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const [panels, setPanels] = useState<Partial<Record<ScenarioSlot, HTMLDivElement>>>({})
  const setPanel = (slot: ScenarioSlot) => (el: HTMLDivElement | null) => {
    if (el && panels[slot] !== el) setPanels((p) => ({ ...p, [slot]: el }))
  }

  return (
    <div ref={setContainer} className="relative grid h-full grid-cols-2 bg-[#e9ebee]">
      {SLOTS.map((slot) => (
        // Panels are transparent and sit above the canvas, so labels and controls
        // show on top of the 3D image and receive the mouse.
        <div
          key={slot}
          ref={setPanel(slot)}
          className="relative z-10 border-slate-300 first:border-r"
        >
          <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
            <span
              className="rounded px-2 py-0.5 text-sm font-semibold text-white"
              style={{ backgroundColor: SCENARIO_COLORS[slot] }}
            >
              方案 {slot}
            </span>
            {overlay?.(slot)}
          </div>
        </div>
      ))}
      {container && (
        <Canvas
          eventSource={container}
          className="pointer-events-none"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          gl={{ stencil: true }} // the section cap needs a stencil buffer
          onCreated={({ gl }) => {
            gl.localClippingEnabled = true // per-material clipping planes
          }}
        >
          {SLOTS.map((slot) => {
            const panel = panels[slot]
            if (!panel) return null
            return (
              <View key={slot} track={{ current: panel }}>
                <color attach="background" args={['#e9ebee']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[300, 400, 500]} intensity={1.6} />
                <FractureScene scenario={scenarios[slot]} />
                <SyncedControls domElement={panel} />
              </View>
            )
          })}
        </Canvas>
      )}
    </div>
  )
}
