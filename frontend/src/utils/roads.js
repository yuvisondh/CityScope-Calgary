import { latLonToXZ } from './geo.js'

const BBOX = {
  minLat: 51.040,
  maxLat: 51.045,
  minLon: -114.075,
  maxLon: -114.062,
}

const BASE_URL = 'https://data.calgary.ca/resource/hkdi-mfmp.geojson'
const SPATIAL_BOX = `within_box(__GEOM__,${BBOX.maxLat},${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon})`
const LIMIT = 500

async function tryFetch(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data || !Array.isArray(data.features)) {
    throw new Error('unexpected response shape')
  }
  return data
}

function inBbox(lon, lat) {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon
}

function featureTouchesBbox(feature) {
  const geom = feature?.geometry
  if (!geom) return false
  const coords = geom.coordinates
  if (geom.type === 'LineString') {
    return coords.some(([lon, lat]) => inBbox(lon, lat))
  }
  if (geom.type === 'MultiLineString') {
    return coords.some(line => line.some(([lon, lat]) => inBbox(lon, lat)))
  }
  return false
}

function projectFeature(feature) {
  const geom = feature?.geometry
  if (!geom) return []
  if (geom.type === 'LineString') {
    return [geom.coordinates.map(([lon, lat]) => latLonToXZ(lat, lon))]
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.map(line =>
      line.map(([lon, lat]) => latLonToXZ(lat, lon))
    )
  }
  return []
}

/**
 * Fetch Calgary road centerlines within the Beltline study bbox and project
 * them through the same latLonToXZ used by the building meshes.
 *
 * Tries the Socrata spatial query against `the_geom` first, falls back to
 * `multilinestring`, then to an unfiltered fetch with client-side bbox
 * filtering if both spatial queries fail.
 *
 * @returns {Promise<Array<Array<[number, number]>>>} road segments as
 *   arrays of projected [x, z] points.
 */
export async function fetchRoads() {
  const attempts = [
    `${BASE_URL}?$where=${encodeURIComponent(SPATIAL_BOX.replace('__GEOM__', 'the_geom'))}&$limit=${LIMIT}`,
    `${BASE_URL}?$where=${encodeURIComponent(SPATIAL_BOX.replace('__GEOM__', 'multilinestring'))}&$limit=${LIMIT}`,
  ]

  let features = null
  for (const url of attempts) {
    try {
      const data = await tryFetch(url)
      features = data.features
      break
    } catch {
      // try next strategy
    }
  }

  if (!features) {
    const data = await tryFetch(`${BASE_URL}?$limit=${LIMIT}`)
    features = data.features.filter(featureTouchesBbox)
  }

  const segments = []
  for (const f of features) {
    for (const projected of projectFeature(f)) {
      if (projected.length >= 2) segments.push(projected)
    }
  }
  return segments
}
