import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Hoisted constants — no new arrays on re-render (rendering-hoist-jsx)
const CAMERA = { position: [0, 80, 160], fov: 50, near: 0.1, far: 5000 }
const GROUND_ARGS = [2000, 2000]
const GROUND_ROT = [-Math.PI / 2, 0, 0]
const DIR_LIGHT_POS = [100, 200, 100]

function Ground() {
  return (
    <mesh rotation={GROUND_ROT} receiveShadow>
      <planeGeometry args={GROUND_ARGS} />
      <meshStandardMaterial color="#1a2e1a" />
    </mesh>
  )
}

export default function CityScene() {
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
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={800}
      />
    </Canvas>
  )
}
