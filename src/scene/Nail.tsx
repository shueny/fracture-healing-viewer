import { useMemo } from 'react'
import { CylinderGeometry, MeshStandardMaterial } from 'three'
import { LOCKING_SCREW, NAIL, nailScale, type NailDiameterMm } from './nailDimensions'
import { SectionCap, SectionedMesh } from './Section'
import { SECTION_LAYERS } from './sectionMaterials'

// Cut-surface colour for metal, darker than the titanium surface.
const CAP_COLOR = '#7d848c'

interface NailProps {
  diameterMm: NailDiameterMm
}

export function Nail({ diameterMm }: NailProps) {
  // Built once; a diameter change only changes the scale below.
  const { nailGeometry, screwGeometry, material } = useMemo(() => {
    const nailGeometry = new CylinderGeometry(0.5, 0.5, NAIL.lengthMm, NAIL.radialSegments)
    const r = LOCKING_SCREW.diameterMm / 2
    const screwGeometry = new CylinderGeometry(r, r, LOCKING_SCREW.lengthMm, 24)
    screwGeometry.rotateZ(Math.PI / 2) // cylinder runs along Y; turn it to X
    const material = new MeshStandardMaterial({
      color: '#b8bec6',
      metalness: 0.3,
      roughness: 0.4,
    })
    return { nailGeometry, screwGeometry, material }
  }, [])

  const layer = SECTION_LAYERS.implant
  return (
    <>
      <group scale={nailScale(diameterMm)}>
        <SectionedMesh geometry={nailGeometry} material={material} layer={layer} />
      </group>
      {LOCKING_SCREW.offsetsMm.map((y) => (
        <group key={y} position={[0, y, 0]}>
          <SectionedMesh geometry={screwGeometry} material={material} layer={layer} />
        </group>
      ))}
      <SectionCap width={200} height={600} color={CAP_COLOR} layer={layer} />
    </>
  )
}
