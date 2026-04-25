import { memo, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { fetchRoads } from '../utils/roads.js'

const ROAD_COLOR   = '#3a342b'
const ROAD_OPACITY = 0.4
const ROAD_Y       = 1.0

function buildGeometry(segments) {
  // Each segment of N points contributes (N-1) line pairs = 2*(N-1) vertices.
  let vertexCount = 0
  for (const seg of segments) vertexCount += Math.max(0, seg.length - 1) * 2

  const positions = new Float32Array(vertexCount * 3)
  let i = 0
  for (const seg of segments) {
    for (let k = 0; k < seg.length - 1; k++) {
      const [x1, z1] = seg[k]
      const [x2, z2] = seg[k + 1]
      positions[i++] = x1; positions[i++] = 0; positions[i++] = z1
      positions[i++] = x2; positions[i++] = 0; positions[i++] = z2
    }
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geom
}

/**
 * Roads — fetches Calgary road centerlines on mount and renders them as
 * thin ground-level line segments. Roads are static, so the component is
 * memoized and the buffer geometry is built once via useMemo.
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
    return buildGeometry(segments)
  }, [segments])

  if (!geometry) return null

  return (
    <lineSegments geometry={geometry} position={[0, ROAD_Y, 0]}>
      <lineBasicMaterial
        color={ROAD_COLOR}
        transparent
        opacity={ROAD_OPACITY}
        depthWrite={false}
      />
    </lineSegments>
  )
}

export default memo(Roads)
