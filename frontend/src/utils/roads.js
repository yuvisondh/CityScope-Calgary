import { latLonToXZ } from './geo.js'

// Widened ~20% beyond the building cluster (51.040–51.045, -114.075–-114.062)
// so roads bordering the Beltline are still rendered.
const BBOX = {
  minLat: 51.039,
  maxLat: 51.046,
  minLon: -114.077,
  maxLon: -114.060,
}

const PRIMARY_URL  = 'https://data.calgary.ca/resource/4dx8-rtm5.geojson'
const FALLBACK_URL = 'https://data.calgary.ca/resource/mybc-x96b.geojson'
const LIMIT = 5000

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

function pointInBbox(pt, swapped) {
  const lon = swapped ? pt[1] : pt[0]
  const lat = swapped ? pt[0] : pt[1]
  return inBbox(lon, lat)
}

function featureTouchesBbox(feature, swapped) {
  const geom = feature?.geometry
  if (!geom) return false
  const coords = geom.coordinates
  if (geom.type === 'LineString') {
    return coords.some(pt => pointInBbox(pt, swapped))
  }
  if (geom.type === 'MultiLineString') {
    return coords.some(line => line.some(pt => pointInBbox(pt, swapped)))
  }
  return false
}

function projectFeature(feature, swapped) {
  const geom = feature?.geometry
  if (!geom) return []
  const projectPoint = swapped
    ? ([lat, lon]) => latLonToXZ(lat, lon)
    : ([lon, lat]) => latLonToXZ(lat, lon)
  if (geom.type === 'LineString') {
    return [geom.coordinates.map(projectPoint)]
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.map(line => line.map(projectPoint))
  }
  return []
}

/**
 * Fetch Calgary road centerlines and project them through the same
 * latLonToXZ used by the building meshes.
 *
 * Skips Socrata $where spatial filtering (geometry column names are
 * inconsistent across datasets) and instead pulls a wide sample, filtering
 * client-side against a slightly-widened Beltline bbox. Auto-detects whether
 * the dataset uses GeoJSON-standard [lon, lat] or non-standard [lat, lon]
 * coordinate ordering by counting bbox hits in each orientation.
 *
 * @returns {Promise<Array<Array<[number, number]>>>} road segments as
 *   arrays of projected [x, z] points.
 */
export async function fetchRoads() {
  const datasets = [PRIMARY_URL, FALLBACK_URL]

  let rawFeatures = []
  for (const base of datasets) {
    try {
      const data = await tryFetch(`${base}?$limit=${LIMIT}`)
      rawFeatures = data.features
      break
    } catch {
      // try next dataset
    }
  }

  const standardHits = rawFeatures.filter(f => featureTouchesBbox(f, false))
  const swappedHits  = rawFeatures.filter(f => featureTouchesBbox(f, true))
  console.log('[roads] raw:', rawFeatures.length, 'bbox hits [lon,lat]:', standardHits.length, 'bbox hits [lat,lon]:', swappedHits.length)

  const swapped = swappedHits.length > standardHits.length
  const features = swapped ? swappedHits : standardHits

  const segments = []
  for (const f of features) {
    for (const projected of projectFeature(f, swapped)) {
      if (projected.length >= 2) segments.push(projected)
    }
  }
  console.log('[roads] using', swapped ? '[lat,lon]' : '[lon,lat]', 'order — final segments:', segments.length)
  return segments
}
