import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { latLonToXZ } from '../utils/geo'

// Rotation maps ExtrudeGeometry's +Z extrusion → world +Y (up)
const GROUP_ROT = [-Math.PI / 2, 0, 0]

const DEFAULT_COLOR  = '#3b7dd8'
const SELECTED_COLOR = '#f59e0b'

/** Builds a THREE.Shape from a GeoJSON footprint ring ([lon, lat][] format). */
function buildShape(footprint) {
  const shape = new THREE.Shape()
  footprint.forEach(([lon, lat], i) => {
    const [x, z] = latLonToXZ(lat, lon)
    if (i === 0) shape.moveTo(x, z)
    else shape.lineTo(x, z)
  })
  return shape
}

/**
 * Renders a single building as an extruded 3D mesh.
 * Fires onClick(building) on pointer click; stopPropagation prevents
 * bubbling through overlapping buildings in the scene graph.
 *
 * @param {{ building: Object, isSelected: boolean, onClick: Function }} props
 */
function BuildingMesh({ building, isSelected, onClick }) {
  const { footprint, height_m } = building

  const shape = useMemo(() => buildShape(footprint), [footprint])

  const extrudeArgs = useMemo(
    () => [shape, { depth: Math.max(height_m, 3), bevelEnabled: false }],
    [shape, height_m]
  )

  function handleClick(e) {
    e.stopPropagation()
    onClick(building)
  }

  return (
    <group rotation={GROUP_ROT}>
      <mesh castShadow receiveShadow onClick={handleClick}>
        <extrudeGeometry args={extrudeArgs} />
        {/* R3F updates color in-place on the existing material — no disposal needed */}
        <meshStandardMaterial color={isSelected ? SELECTED_COLOR : DEFAULT_COLOR} />
      </mesh>
    </group>
  )
}

// Memo: buildings are fetched once and never mutate — only re-render on prop change
export default memo(BuildingMesh)
