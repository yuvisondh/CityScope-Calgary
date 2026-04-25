import { latLonToXZ } from './geo.js'

const URL = 'https://data.calgary.ca/resource/4dx8-rtm5.geojson'
// Bbox widened ~20% beyond the building cluster (51.040–51.045, -114.075–-114.062)
// so roads bordering the Beltline are still rendered.
// Socrata within_box arg order: (geom, north_lat, west_lon, south_lat, east_lon).
const SPATIAL = 'within_box(line,51.046,-114.077,51.039,-114.060)'
const LIMIT = 500

function projectFeature(feature) {
  const geom = feature?.geometry
  if (!geom) return []
  const project = ([lon, lat]) => latLonToXZ(lat, lon)
  if (geom.type === 'LineString') {
    return [geom.coordinates.map(project)]
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.map(line => line.map(project))
  }
  return []
}

/**
 * Fetch Calgary road centerlines within the Beltline bbox and project them
 * through the same latLonToXZ used by the building meshes.
 *
 * Uses Socrata's server-side `within_box(line, …)` spatial filter against the
 * Street Centreline dataset (4dx8-rtm5). The geometry column is named `line`
 * — not `the_geom` — which is why earlier attempts 400'd.
 *
 * @returns {Promise<Array<Array<[number, number]>>>} road segments as
 *   arrays of projected [x, z] points.
 */
export async function fetchRoads() {
  const res = await fetch(`${URL}?$where=${encodeURIComponent(SPATIAL)}&$limit=${LIMIT}`)
  if (!res.ok) throw new Error(`roads fetch failed: HTTP ${res.status}`)
  const data = await res.json()

  const segments = []
  for (const f of data.features ?? []) {
    for (const projected of projectFeature(f)) {
      if (projected.length >= 2) segments.push(projected)
    }
  }
  return segments
}
