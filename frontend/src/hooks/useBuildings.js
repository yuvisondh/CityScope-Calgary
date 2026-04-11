import { useState, useEffect } from 'react'
import { fetchBuildings } from '../api/buildings'

/**
 * Fetches the full buildings dataset once on mount.
 * Uses AbortController so an unmounted component never updates stale state.
 */
export function useBuildings() {
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchBuildings(controller.signal)
      .then(data => {
        setBuildings(data.buildings ?? [])
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return { buildings, loading, error }
}
