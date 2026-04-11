import { useState, useEffect, useCallback } from 'react'
import {
  fetchProjects,
  createProject,
  deleteProject as deleteProjectAPI,
} from '../api/projects'

const STORAGE_KEY = 'masiv_username'

/**
 * useProjects — manages saved project CRUD and the current username.
 *
 * Username is persisted to localStorage so it survives page reloads.
 * Projects are fetched whenever currentUsername changes; an empty username
 * skips the request and returns an empty list.
 *
 * @returns {{
 *   projects: Array,
 *   loading: boolean,
 *   error: string|null,
 *   currentUsername: string,
 *   setCurrentUsername: (name: string) => void,
 *   activeProjectId: number|null,
 *   saveProject: (name: string, filters: Object[]) => Promise<void>,
 *   loadProject: (project: Object) => void,
 *   deleteProject: (id: number) => Promise<void>,
 * }}
 */
export function useProjects() {
  // rerender-lazy-state-init: localStorage read runs exactly once on mount
  const [currentUsername, setCurrentUsernameState] = useState(
    () => localStorage.getItem(STORAGE_KEY) ?? ''
  )
  const [projects,       setProjects]       = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [activeProjectId, setActiveProjectId] = useState(null)

  // Re-fetch whenever the username changes; skip if blank
  useEffect(() => {
    if (!currentUsername.trim()) {
      setProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const controller = new AbortController()

    fetchProjects(currentUsername, controller.signal)
      .then(data => {
        setProjects(data.projects ?? [])
        setLoading(false)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [currentUsername])

  /**
   * Persists username to localStorage and updates state.
   * @param {string} name
   */
  const setCurrentUsername = useCallback((name) => {
    localStorage.setItem(STORAGE_KEY, name)
    setCurrentUsernameState(name)
  }, [])

  /**
   * POSTs a new project and optimistically prepends it to the list.
   * (POST returns only {id, message}, so we construct the object locally.)
   * @param {string} name
   * @param {Object[]} filters
   */
  const saveProject = useCallback(async (name, filters) => {
    if (!currentUsername.trim()) return
    setError(null)
    try {
      const { id } = await createProject({ username: currentUsername, name, filters })
      const optimistic = { id, name, filters, created_at: new Date().toISOString() }
      setProjects(prev => [optimistic, ...prev])
    } catch (err) {
      setError(err.message)
    }
  }, [currentUsername])

  /**
   * Marks a project as active (for panel UI feedback).
   * App is responsible for calling useQuery.loadFilters(project.filters).
   * @param {Object} project
   */
  const loadProject = useCallback((project) => {
    setActiveProjectId(project.id)
  }, [])

  /**
   * Deletes a project by ID and removes it from local state optimistically.
   * @param {number} id
   */
  const deleteProject = useCallback(async (id) => {
    setError(null)
    try {
      await deleteProjectAPI(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      setActiveProjectId(prev => (prev === id ? null : prev))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  return {
    projects,
    loading,
    error,
    currentUsername,
    setCurrentUsername,
    activeProjectId,
    saveProject,
    loadProject,
    deleteProject,
  }
}
