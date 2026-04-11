import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import BuildingMesh from './BuildingMesh'

// Hoisted constants — no new arrays on re-render (rendering-hoist-jsx)
// Camera pulled back to show the full ~846m × 518m Beltline dataset
const CAMERA = { position: [0, 500, 750], fov: 55, near: 0.1, far: 5000 }
const GROUND_ARGS = [2000, 2000]
const GROUND_ROT = [-Math.PI / 2, 0, 0]
const DIR_LIGHT_POS = [200, 400, 200]

function Ground() {
  return (
    <mesh rotation={GROUND_ROT} receiveShadow>
      <planeGeometry args={GROUND_ARGS} />
      <meshStandardMaterial color="#1a2e1a" />
    </mesh>
  )
}

export default function CityScene({ buildings, selectedBuildingId, matchedIds, onBuildingClick }) {
  // Set for O(1) highlight lookup (js-index-maps) — recomputed only when matchedIds changes
  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds])

  return (
    <Canvas camera={CAMERA} shadows style={{ background: '#0d1117' }}>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={DIR_LIGHT_POS}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Ground />
      {buildings.map(building => (
        <BuildingMesh
          key={building.id}
          building={building}
          isSelected={selectedBuildingId === building.id}
          isHighlighted={matchedSet.has(building.id)}
          onClick={onBuildingClick}
        />
      ))}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={2000}
      />
    </Canvas>
  )
}
