import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { latLonToXZ } from '../utils/geo'

// Rotation maps ExtrudeGeometry's +Z extrusion → world +Y (up)
const GROUP_ROT = [-Math.PI / 2, 0, 0]

function buildShape(footprint) {
  const shape = new THREE.Shape()
  footprint.forEach(([lon, lat], i) => {
    const [x, z] = latLonToXZ(lat, lon)
    if (i === 0) shape.moveTo(x, z)
    else shape.lineTo(x, z)
  })
  return shape
}

function BuildingMesh({ building }) {
  const { footprint, height_m } = building

  const shape = useMemo(() => buildShape(footprint), [footprint])

  const extrudeArgs = useMemo(
    () => [shape, { depth: Math.max(height_m, 3), bevelEnabled: false }],
    [shape, height_m]
  )

  return (
    <group rotation={GROUP_ROT}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={extrudeArgs} />
        <meshStandardMaterial color="#3b7dd8" />
      </mesh>
    </group>
  )
}

// Memo: buildings are fetched once and never mutate — skip all re-renders
export default memo(BuildingMesh)
