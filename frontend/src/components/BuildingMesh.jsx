import { memo, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { latLonToXZ } from '../utils/geo'

// ─── Geometry constants ───────────────────────────────────────────────────────
// Rotation maps ExtrudeGeometry's +Z extrusion → world +Y (up)
const GROUP_ROT = [-Math.PI / 2, 0, 0]
const MIN_HEIGHT = 3  // metres — prevents flat footprints from being invisible

// ─── Color tokens (mirror CSS custom properties from index.css) ───────────────
// These are duplicated here because Three.js materials accept hex strings, not
// CSS var() references. Every value traces back to DESIGN_SPEC.md Section 2.

// Selection / highlight — strict priority order per spec
const SELECTED_COLOR  = '#c8102e'  // var(--accent-flag)
const HIGHLIGHT_COLOR = '#a00d24'  // var(--highlight-color), slightly desaturated

// Zoning bucket base colors — revised for hue separation (sand, green, blue,
// rose, grey). Mirrors CSS tokens in index.css; duplicated here because Three.js
// materials accept hex strings, not CSS var() references.
const ZONING_COMMERCIAL  = '#c4a478'  // var(--zoning-commercial) — warm sand
const ZONING_MIXED       = '#8b9e8b'  // var(--zoning-mixed)       — sage green
const ZONING_RESIDENTIAL = '#7895a3'  // var(--zoning-residential) — dusty blue
const ZONING_INDUSTRIAL  = '#a08070'  // var(--zoning-industrial)  — clay rose
const ZONING_OTHER       = '#8a8580'  // var(--zoning-other)       — warm concrete

// ─── Material properties (DESIGN_SPEC.md Section 5) ───────────────────────────
const ROUGHNESS = 0.85   // matte, no plasticky shine
const METALNESS = 0.0

// Hover emissive intensity — deliberate amendment from the original spec.
// The spec called for a 0.95→1.0 opacity bump on hover, but buildings are
// solid at 1.0 by default, making that invisible. Replaced with a subtle
// emissiveIntensity bump using the building's own bucket color, which gives
// a "lift" effect without affecting transparency or scene clarity.
const HOVER_EMISSIVE_INTENSITY = 0.08

// ─── Zoning → bucket color mapping ───────────────────────────────────────────

/**
 * Maps a Calgary zoning code to its bucket color.
 * Uses prefix matching against the five buckets defined in DESIGN_SPEC.md
 * Section 2 ("Building Materials by Zoning"). Codes are matched
 * case-insensitively; unrecognised codes fall through to the "Other" bucket.
 *
 * @param {string|null} zoning - Calgary zoning code (e.g. "CC-X", "RC-G")
 * @returns {string} hex color for the zoning bucket
 */
function zoningToBucket(zoning) {
  if (!zoning) return ZONING_OTHER

  const code = zoning.toUpperCase().trim()

  // Commercial Core — CC-*, C-COR*, C-C2
  if (code.startsWith('CC-') || code.startsWith('C-COR') || code === 'C-C2') {
    return ZONING_COMMERCIAL
  }
  // Mixed Use — CR20, CR-20, M-CG, M-X*, MU-*
  if (code.startsWith('CR') || code.startsWith('M-') || code.startsWith('MU')) {
    return ZONING_MIXED
  }
  // Residential — RC-G, R-*
  if (code.startsWith('RC-') || code.startsWith('R-')) {
    return ZONING_RESIDENTIAL
  }
  // Industrial / Special — I-*, S-*, DC
  if (code.startsWith('I-') || code.startsWith('S-') || code === 'DC') {
    return ZONING_INDUSTRIAL
  }

  return ZONING_OTHER
}

// ─── Geometry helper ──────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Renders a single building as an extruded 3D mesh with zoning-based color.
 *
 * Color priority (DESIGN_SPEC.md Section 2, "Selection / Highlight States"):
 *   1. isSelected (click)  → Flames red (#c8102e)
 *   2. isHighlighted (query match) → desaturated Flames red (#a00d24)
 *   3. else → zoning bucket color from zoningToBucket()
 *
 * Hover: emissiveIntensity bump to 0.08 using the bucket color as emissive,
 * plus cursor → pointer. No opacity change, no glow shader.
 *
 * @param {{ building: Object, isSelected: boolean, isHighlighted: boolean, onClick: Function }} props
 */
function BuildingMesh({ building, isSelected, isHighlighted, onClick }) {
  const { footprint, height_m, zoning } = building
  const [hovered, setHovered] = useState(false)

  const shape = useMemo(() => buildShape(footprint), [footprint])

  const extrudeArgs = useMemo(
    () => [shape, { depth: Math.max(height_m, MIN_HEIGHT), bevelEnabled: false }],
    [shape, height_m],
  )

  const bucketColor = useMemo(() => zoningToBucket(zoning), [zoning])

  // Resolve display color by priority: selected > highlighted > bucket
  const displayColor = isSelected
    ? SELECTED_COLOR
    : isHighlighted
      ? HIGHLIGHT_COLOR
      : bucketColor

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    onClick(building)
  }, [building, onClick])

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }, [])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  return (
    <group rotation={GROUP_ROT}>
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <extrudeGeometry args={extrudeArgs} />
        <meshStandardMaterial
          color={displayColor}
          roughness={ROUGHNESS}
          metalness={METALNESS}
          emissive={bucketColor}
          emissiveIntensity={hovered ? HOVER_EMISSIVE_INTENSITY : 0}
        />
      </mesh>
    </group>
  )
}

// Memo: buildings are fetched once and never mutate — only re-render on prop change
export default memo(BuildingMesh)
