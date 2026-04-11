const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

/**
 * Fetches all saved projects for a given username.
 * Returns an empty list if username is blank (avoids a backend 400).
 * @param {string} username
 * @param {AbortSignal} signal
 * @returns {Promise<{projects: Array}>}
 */
export async function fetchProjects(username, signal) {
  if (!username.trim()) return { projects: [] }
  const url = `${BASE_URL}/api/projects?username=${encodeURIComponent(username)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`)
  return res.json()
}

/**
 * Creates a new saved project for the given user.
 * @param {{ username: string, name: string, filters: Object[] }} payload
 * @returns {Promise<{id: number, message: string}>}
 */
export async function createProject({ username, name, filters }) {
  const res = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, name, filters }),
  })
  if (!res.ok) throw new Error(`Failed to save project: ${res.status}`)
  return res.json()
}

/**
 * Deletes a project by ID.
 * @param {number} id
 * @returns {Promise<{message: string}>}
 */
export async function deleteProject(id) {
  const res = await fetch(`${BASE_URL}/api/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete project: ${res.status}`)
  return res.json()
}
