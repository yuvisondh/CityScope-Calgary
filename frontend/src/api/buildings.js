const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

/**
 * Fetches all buildings from the Flask backend.
 * @param {AbortSignal} signal - AbortController signal for cleanup
 * @returns {Promise<{buildings: Array, metadata: Object}>}
 */
export async function fetchBuildings(signal) {
  const res = await fetch(`${BASE_URL}/api/buildings`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch buildings: ${res.status}`)
  return res.json()
}
