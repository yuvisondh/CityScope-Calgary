import { latLonToXZ } from './geo.js'

const BBOX = {
  minLat: 51.040,
  maxLat: 51.045,
  minLon: -114.075,
  maxLon: -114.062,
}

const PRIMARY_URL  = 'https://data.calgary.ca/resource/4dx8-rtm5.geojson'
const FALLBACK_URL = 'https://data.calgary.ca/resource/mybc-x96b.geojson'
const SPATIAL_BOX = `within_box(the_geom,${BBOX.maxLat},${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon})`
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
 * Tries the Street Centreline dataset (4dx8-rtm5) with a spatial filter, then
 * falls back to the Major Road Network (mybc-x96b). For each dataset, attempts
 * a $where=within_box spatial query first, then an unfiltered fetch with
 * client-side bbox filtering.
 *
 * @returns {Promise<Array<Array<[number, number]>>>} road segments as
 *   arrays of projected [x, z] points.
 */
export async function fetchRoads() {
  const datasets = [PRIMARY_URL, FALLBACK_URL]

  let features = null
  for (const base of datasets) {
    try {
      const data = await tryFetch(`${base}?$where=${encodeURIComponent(SPATIAL_BOX)}&$limit=${LIMIT}`)
      features = data.features
      break
    } catch {
      try {
        const data = await tryFetch(`${base}?$limit=${LIMIT}`)
        features = data.features.filter(featureTouchesBbox)
        break
      } catch {
        // try next dataset
      }
    }
  }

  if (!features) features = []

  const segments = []
  for (const f of features) {
    for (const projected of projectFeature(f)) {
      if (projected.length >= 2) segments.push(projected)
    }
  }
  return segments
}
