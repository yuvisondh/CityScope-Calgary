// Dataset center — used as world origin (0, 0, 0)
export const CENTER_LAT = 51.041896
export const CENTER_LON = -114.068529

const LAT_SCALE = 111320 // metres per degree of latitude
const LON_SCALE = LAT_SCALE * Math.cos(CENTER_LAT * Math.PI / 180) // ~70 020 m/deg

/**
 * Project geographic coordinates to local XZ world units (metres).
 * Returns [x, z] where +x = east, +z = south.
 * Apply group rotation [-PI/2, 0, 0] so ExtrudeGeometry extrudes upward in Y.
 */
export function latLonToXZ(lat, lon) {
  const x = (lon - CENTER_LON) * LON_SCALE
  const z = (lat - CENTER_LAT) * LAT_SCALE
  return [x, z]
}
