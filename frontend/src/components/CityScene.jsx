import { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import BuildingMesh from './BuildingMesh'

// ─── Scene constants (all colors reference DESIGN_SPEC.md tokens) ─────────────
// Camera pulled back to show the full ~846m × 518m Beltline dataset
const CAMERA = { position: [0, 500, 750], fov: 55, near: 0.1, far: 5000 }

// Canvas background — var(--bg-base) equivalent for the Three.js canvas
const SCENE_BG = '#1a1815'

// Ground plane — var(--scene-ground), slightly darker than bg-base so the
// ground reads as visually below the buildings, not the same plane
const GROUND_COLOR = '#0e0c09'
const GROUND_ARGS  = [2000, 2000]
const GROUND_ROT   = [-Math.PI / 2, 0, 0]

// Survey grid — white lines at 50m intervals
const GRID_SIZE      = 2000
const GRID_DIVISIONS = 40     // 2000m / 40 = 50m per cell
const GRID_COLOR     = '#ffffff'
const GRID_OPACITY   = 0.08
// y=1.0 prevents z-fighting against the 2000×2000 ground plane — 0.01 is
// not enough at this scale; GPU precision causes the lines to flicker.
const GRID_Y_OFFSET  = 1.0

// Three-point lighting — warm sunlight primary, cool fill, warm ambient
const AMBIENT_COLOR    = '#fff5e6'
const AMBIENT_INTENSITY = 0.45

const PRIMARY_LIGHT_POS       = [200, 400, 200]
const PRIMARY_LIGHT_COLOR     = '#ffe9c9'
const PRIMARY_LIGHT_INTENSITY = 0.85
const SHADOW_MAP_SIZE         = [2048, 2048]

const FILL_LIGHT_POS       = [-200, 200, -200]
const FILL_LIGHT_COLOR     = '#aab8c4'
const FILL_LIGHT_INTENSITY = 0.25

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Ground plane — flat dark surface beneath the city. */
function Ground() {
  return (
    <mesh rotation={GROUND_ROT} receiveShadow raycast={() => null}>
      {/* raycast={() => null} makes the ground invisible to the raycaster so
          clicks on it pass through to Canvas.onPointerMissed, triggering
          deselection. Without this, the ground mesh would swallow clicks and
          onPointerMissed would never fire for ground-level clicks. */}
      <planeGeometry args={GROUND_ARGS} />
      <meshStandardMaterial color={GROUND_COLOR} />
    </mesh>
  )
}

/**
 * SurveyGrid — white grid lines at 50m intervals.
 * Reads as a survey-grid reference; barely visible from default camera
 * distance, more prominent only when zoomed in.
 *
 * Opacity is applied via ref + useEffect rather than R3F pierce props
 * (material-transparent / material-opacity) because Three.js gridHelper
 * creates a LineSegments with an *array* of two LineBasicMaterials — one
 * for the center lines and one for the grid lines. Pierce props only reach
 * a single material, so opacity was silently ignored.
 */
function SurveyGrid() {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current) return
    const materials = Array.isArray(ref.current.material)
      ? ref.current.material
      : [ref.current.material]
    materials.forEach(m => {
      m.transparent = true
      m.opacity = GRID_OPACITY
    })
  }, [])

  return (
    <gridHelper
      ref={ref}
      args={[GRID_SIZE, GRID_DIVISIONS, GRID_COLOR, GRID_COLOR]}
      position={[0, GRID_Y_OFFSET, 0]}
    />
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CityScene — Three.js canvas containing the 3D city, ground plane, grid,
 * lighting, and orbit controls.
 *
 * Deselection uses Canvas's onPointerMissed rather than a document-level click
 * listener. onPointerMissed fires only when a click hits the canvas but doesn't
 * intersect any raycast-enabled mesh — so clicks on HTML overlay panels
 * (BuildingInfoPanel, QueryInput, etc.) are ignored automatically because they
 * intercept in HTML space before reaching the canvas. The ground mesh uses
 * raycast={() => null} so it doesn't block this.
 *
 * @param {{ buildings: Object[], selectedBuildingId: string|null, matchedIds: string[], onBuildingClick: Function, onDeselect: Function }} props
 */
export default function CityScene({ buildings, selectedBuildingId, matchedIds, onBuildingClick, onDeselect }) {
  // Set for O(1) highlight lookup (js-index-maps) — recomputed only when matchedIds changes
  const matchedSet = useMemo(() => new Set(matchedIds), [matchedIds])

  return (
    <Canvas camera={CAMERA} shadows style={{ background: SCENE_BG }} onPointerMissed={onDeselect}>
      {/* Three-point lighting: warm ambient + warm directional primary + cool fill */}
      <ambientLight color={AMBIENT_COLOR} intensity={AMBIENT_INTENSITY} />
      <directionalLight
        position={PRIMARY_LIGHT_POS}
        color={PRIMARY_LIGHT_COLOR}
        intensity={PRIMARY_LIGHT_INTENSITY}
        castShadow
        shadow-mapSize={SHADOW_MAP_SIZE}
      />
      <directionalLight
        position={FILL_LIGHT_POS}
        color={FILL_LIGHT_COLOR}
        intensity={FILL_LIGHT_INTENSITY}
      />

      <Ground />
      <SurveyGrid />

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
