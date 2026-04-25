import { memo, useEffect, useMemo, useState } from 'react'
import { Line } from '@react-three/drei'
import { fetchRoads } from '../utils/roads.js'

// Warm sodium-lamp amber — pairs with the dark warm ground (#0e0c09) and
// evokes an illuminated street network. Drei's <Line> uses Line2 under the
// hood, so lineWidth is respected (raw THREE.LineBasicMaterial.linewidth
// silently clamps to 1px on every major browser).
const ROAD_COLOR     = '#b88a4a'
const ROAD_OPACITY   = 0.6
const ROAD_LINEWIDTH = 1.5
const ROAD_Y         = 1.0

/**
 * Roads — fetches Calgary road centerlines on mount and renders them as a
 * single fat-line batch. Roads are static, so the component is memoized and
 * the projected point list is built once via useMemo.
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

  // Flatten segments into a points array of [x, y, z] pairs. With segments=true,
  // drei treats consecutive points as discrete line segments (a, b, c, d → ab, cd).
  const points = useMemo(() => {
    if (!segments || segments.length === 0) return null
    const pts = []
    for (const seg of segments) {
      for (let k = 0; k < seg.length - 1; k++) {
        const [x1, z1] = seg[k]
        const [x2, z2] = seg[k + 1]
        pts.push([x1, ROAD_Y, z1], [x2, ROAD_Y, z2])
      }
    }
    return pts
  }, [segments])

  if (!points) return null

  return (
    <Line
      points={points}
      segments
      color={ROAD_COLOR}
      lineWidth={ROAD_LINEWIDTH}
      transparent
      opacity={ROAD_OPACITY}
      depthWrite={false}
    />
  )
}

export default memo(Roads)
