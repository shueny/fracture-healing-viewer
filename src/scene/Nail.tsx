import { useMemo } from 'react'
import { MeshStandardMaterial, Vector3 } from 'three'
import { FEMUR } from '../data/femur'
import { NAIL, NAIL_DIAMETERS_MM, LOCKING_SCREW, type NailDiameterMm } from './nailDimensions'
import { buildRodAlongCurve, buildUnitScrew } from './nailGeometry'
import { SectionCap, SectionedMesh } from './Section'
import { SECTION_LAYERS } from './sectionMaterials'

// Cut-surface colour for metal, darker than the titanium surface.
const CAP_COLOR = '#7d848c'

interface NailProps {
  diameterMm: NailDiameterMm
}

// The nail follows the bow of the real femur, so it cannot be a scaled
// straight cylinder. Both diameters are built once on first render; a
// diameter change only switches which one is visible (performance rule 9).
export function Nail({ diameterMm }: NailProps) {
  const { nails, screwGeometry, material } = useMemo(() => {
    const half = NAIL.lengthMm / 2
    const path = FEMUR.centerline
      .filter(([, y]) => Math.abs(y) <= half)
      .map(([x, y, z]) => new Vector3(x, y, z))
    const nails = Object.fromEntries(
      NAIL_DIAMETERS_MM.map((d) => [d, buildRodAlongCurve(path, d / 2, NAIL.radialSegments)]),
    ) as Record<NailDiameterMm, ReturnType<typeof buildRodAlongCurve>>
    const material = new MeshStandardMaterial({ color: '#b8bec6', metalness: 0.3, roughness: 0.4 })
    return { nails, screwGeometry: buildUnitScrew(LOCKING_SCREW.diameterMm), material }
  }, [])

  const layer = SECTION_LAYERS.implant
  return (
    <>
      {NAIL_DIAMETERS_MM.map((d) => (
        <group key={d} visible={d === diameterMm}>
          <SectionedMesh geometry={nails[d]} material={material} layer={layer} />
        </group>
      ))}
      {FEMUR.screws.map((s) => (
        <group key={s.y} position={[s.center[0], s.y, s.center[1]]} scale={[s.lengthMm, 1, 1]}>
          <SectionedMesh geometry={screwGeometry} material={material} layer={layer} />
        </group>
      ))}
      <SectionCap width={200} height={600} color={CAP_COLOR} layer={layer} />
    </>
  )
}
