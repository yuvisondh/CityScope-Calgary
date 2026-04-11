const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

/**
 * Posts a natural-language query to the Flask LLM endpoint.
 * @param {string} queryText - The user's natural language query.
 * @returns {Promise<{matched_ids: string[], filters: Object[], method_used: string, raw_llm_response: string|null}>}
 */
export async function postQuery(queryText) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryText }),
  })
  if (!res.ok) throw new Error(`Query failed: ${res.status}`)
  return res.json()
}
