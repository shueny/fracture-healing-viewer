import { useEffect, useMemo } from 'react'
import { Color, ShaderMaterial } from 'three'
import callusCapFrag from '../shaders/callusCap.frag?raw'
import callusCapVert from '../shaders/callusCap.vert?raw'
import callusFrag from '../shaders/callus.frag?raw'
import callusVert from '../shaders/callus.vert?raw'
import callusStencilFrag from '../shaders/callusStencil.frag?raw'
import tissueGlsl from '../shaders/tissue.glsl?raw'
import { buildCallusGeometry, type CallusShape } from './callusGeometry'
import { CALLUS, TISSUES } from './callusModel'
import {
  SECTION_LAYERS,
  SECTION_PLANE,
  STENCIL_SIDES,
  makeCapPass,
  makeStencilPass,
  sectionRenderOrder,
} from './sectionMaterials'

interface CallusProps {
  shape: CallusShape
  consolidationPct: number // C(t), 0..100
}

// Callus around the fracture: one full-size geometry, shaped and coloured for
// the current week by shaders. Same section layering as bone and implants,
// but every pass needs the callus vertex shader so the stencil counts the
// shrunken shape, not the full-size one.
export function Callus({ shape, consolidationPct }: CallusProps) {
  const { geometry, uniforms, surface, stencils, cap } = useMemo(() => {
    // One uniforms object shared by all passes: one update moves them all.
    const uniforms = {
      uConsolidation: { value: 0 },
      uBoneRadius: { value: shape.boneRadius + CALLUS.boneOffsetMm },
      uHalfLength: { value: CALLUS.halfLengthMm },
      uTissueColors: { value: TISSUES.map((t) => new Color(t.color)) },
    }
    const clipped = { uniforms, clipping: true, clippingPlanes: [SECTION_PLANE] }
    const surface = new ShaderMaterial({
      ...clipped,
      vertexShader: tissueGlsl + callusVert,
      fragmentShader: tissueGlsl + callusFrag,
    })
    const stencils = STENCIL_SIDES.map((side) =>
      makeStencilPass(
        new ShaderMaterial({
          ...clipped,
          vertexShader: tissueGlsl + callusVert,
          fragmentShader: callusStencilFrag,
        }),
        side,
      ),
    )
    const cap = makeCapPass(
      new ShaderMaterial({
        uniforms,
        vertexShader: callusCapVert,
        fragmentShader: tissueGlsl + callusCapFrag,
      }),
    )
    return { geometry: buildCallusGeometry(shape), uniforms, surface, stencils, cap }
  }, [shape])

  useEffect(() => {
    uniforms.uConsolidation.value = consolidationPct / 100
  }, [uniforms, consolidationPct])

  const order = sectionRenderOrder(SECTION_LAYERS.callus)
  return (
    <>
      {stencils.map((m) => (
        <mesh key={m.side} geometry={geometry} material={m} renderOrder={order.stencil} />
      ))}
      <mesh material={cap} renderOrder={order.cap}>
        <planeGeometry args={[100, 2 * CALLUS.halfLengthMm + 10]} />
      </mesh>
      <mesh geometry={geometry} material={surface} renderOrder={order.surface} />
    </>
  )
}
