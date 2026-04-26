import { memo, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { fetchRoads } from '../utils/roads.js'

// Warm sodium-bronze base — looks lit because the material is now PBR
// (meshStandardMaterial), so the directional sun + ambient values from
// getSunState modulate it through the day. At night it fades to near-black
// against cool ambient; at dusk it picks up the warm sun tint.
const ROAD_COLOR     = '#b88a4a'
const ROAD_WIDTH     = 4    // metres — reads at the default camera distance
// y=0.5 prevents z-fighting against the 2000×2000 ground plane — 0.05 is
// not enough at this scene scale (camera far=5000); GPU depth precision
// causes the road quads to flicker. Same lesson as GRID_Y_OFFSET in CityScene.
const ROAD_Y         = 0.5
const ROAD_ROUGHNESS = 0.95
const ROAD_METALNESS = 0.0

/**
 * Build a single BufferGeometry of flat ribbon quads from the road segments.
 * Each [p1, p2] pair becomes a 4m-wide rectangle in the XZ plane, normal +Y.
 * One mesh + one material = one draw call for the entire road network.
 */
function buildRibbonGeometry(segments, width) {
  const positions = []
  const normals = []
  const indices = []
  const hw = width / 2
  let vi = 0

  for (const seg of segments) {
    for (let k = 0; k < seg.length - 1; k++) {
      const [x1, z1] = seg[k]
      const [x2, z2] = seg[k + 1]
      const dx = x2 - x1
      const dz = z2 - z1
      const len = Math.hypot(dx, dz)
      if (len === 0) continue

      // Perpendicular in the XZ plane (rotate direction 90°).
      const px = -dz / len
      const pz = dx / len

      positions.push(
        x1 + px * hw, 0, z1 + pz * hw,
        x1 - px * hw, 0, z1 - pz * hw,
        x2 + px * hw, 0, z2 + pz * hw,
        x2 - px * hw, 0, z2 - pz * hw,
      )
      normals.push(0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0)
      indices.push(vi, vi + 2, vi + 1, vi + 1, vi + 2, vi + 3)
      vi += 4
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3))
  geom.setIndex(indices)
  return geom
}

/**
 * Roads — fetches Calgary road centerlines on mount and renders them as a
 * single lit mesh of thin ribbon quads sitting just above the ground plane.
 * Because the material is meshStandardMaterial, roads respond to the
 * directional + ambient lighting driven by the time-of-day slider — they
 * darken at night, warm at sunset, and receive building shadows at noon.
 */
function Roads() {
  const [segments, setSegments] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchRoads()
      .then(data => { if (!cancelled) setSegments(data) })
      .catch(() => { if (!cancelled) setSegments([]) })
    return () => { cancelled = true }
  }, [])

  const geometry = useMemo(() => {
    if (!segments || segments.length === 0) return null
    return buildRibbonGeometry(segments, ROAD_WIDTH)
  }, [segments])

  if (!geometry) return null

  return (
    <mesh geometry={geometry} position={[0, ROAD_Y, 0]} receiveShadow>
      <meshStandardMaterial
        color={ROAD_COLOR}
        roughness={ROAD_ROUGHNESS}
        metalness={ROAD_METALNESS}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default memo(Roads)
