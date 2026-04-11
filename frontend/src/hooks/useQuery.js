import { useState, useCallback } from 'react'
import { postQuery } from '../api/query'

/**
 * @typedef {Object} QueryState
 * @property {string[]}  matchedIds   - Building IDs returned by the last query.
 * @property {Object[]}  filters      - Structured filters extracted by the LLM.
 * @property {string}    methodUsed   - 'llm' | 'fallback' | 'none'
 * @property {boolean}   loading      - True while a request is in-flight.
 * @property {string|null} error      - Error message if the request failed.
 */

/**
 * useQuery — manages LLM query submission and result state.
 * Does NOT fire on mount; App drives submission via the returned `submitQuery`.
 *
 * @returns {{ state: QueryState, submitQuery: (text: string) => Promise<void>, clearQuery: () => void }}
 */
export function useQuery() {
  const [matchedIds, setMatchedIds] = useState([])
  const [filters,    setFilters]    = useState([])
  const [methodUsed, setMethodUsed] = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)

  // useCallback: stable reference so any parent memo is not busted on re-render
  const submitQuery = useCallback(async (queryText) => {
    if (!queryText.trim()) return           // js-early-exit: skip empty input

    setLoading(true)
    setError(null)

    try {
      const data = await postQuery(queryText)
      // Backend returns a 200 with an `error` field when the LLM can't parse
      if (data.error) {
        setError(data.error)
        return
      }
      setMatchedIds(data.matched_ids ?? [])
      setFilters(data.filters        ?? [])
      setMethodUsed(data.method      ?? 'none')   // route field is `method`, not `method_used`
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])  // no deps — postQuery is a module-level stable import

  const clearQuery = useCallback(() => {
    setMatchedIds([])
    setFilters([])
    setMethodUsed(null)
    setError(null)
  }, [])

  return {
    matchedIds,
    filters,
    methodUsed,
    loading,
    error,
    submitQuery,
    clearQuery,
  }
}
