import { latLonToXZ } from './geo.js'

const BBOX = {
  minLat: 51.040,
  maxLat: 51.045,
  minLon: -114.075,
  maxLon: -114.062,
}

const PRIMARY_URL  = 'https://data.calgary.ca/resource/4dx8-rtm5.geojson'
const FALLBACK_URL = 'https://data.calgary.ca/resource/mybc-x96b.geojson'
const LIMIT = 1000

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
 * Fetch Calgary road centerlines and project them through the same
 * latLonToXZ used by the building meshes.
 *
 * No Socrata $where spatial filter is used — the geometry column name on
 * the GeoJSON endpoint isn't reliable to guess and a 400 stops the whole
 * pipeline. Instead, fetch up to 1000 records and filter client-side by
 * the Beltline bbox. The Major Road Network dataset is used as a fallback
 * if the primary Street Centreline dataset is unavailable.
 *
 * @returns {Promise<Array<Array<[number, number]>>>} road segments as
 *   arrays of projected [x, z] points.
 */
export async function fetchRoads() {
  const datasets = [PRIMARY_URL, FALLBACK_URL]

  let features = []
  for (const base of datasets) {
    try {
      const data = await tryFetch(`${base}?$limit=${LIMIT}`)
      features = data.features.filter(featureTouchesBbox)
      break
    } catch {
      // try next dataset
    }
  }

  const segments = []
  for (const f of features) {
    for (const projected of projectFeature(f)) {
      if (projected.length >= 2) segments.push(projected)
    }
  }
  return segments
}
