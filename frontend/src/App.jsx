import { useState, useCallback } from 'react'
import { useBuildings } from './hooks/useBuildings'
import { useQuery } from './hooks/useQuery'
import { useProjects } from './hooks/useProjects'
import LoadingScreen from './components/LoadingScreen'
import CityScene from './components/CityScene'
import BuildingInfoPanel from './components/BuildingInfoPanel'
import QueryInput from './components/QueryInput'
import ProjectPanel from './components/ProjectPanel'
import ZoningLegend from './components/ZoningLegend'

function App() {
  const { buildings, loading, error: buildingsError } = useBuildings()
  const {
    matchedIds,
    filters,
    methodUsed,
    loading: queryLoading,
    error: queryError,
    submitQuery,
    loadFilters,
  } = useQuery()
  const {
    projects,
    loading: projectsLoading,
    currentUsername,
    setCurrentUsername,
    activeProjectId,
    saveProject,
    loadProject,
    deleteProject,
  } = useProjects()
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  const handleBuildingClick = useCallback((building) => {
    setSelectedBuilding(building)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null)
  }, [])

  /** Saves the current query snapshot (filters + matchedIds) as a named project. */
  const handleSaveProject = useCallback((name) => {
    saveProject(name, { filters, matchedIds })
  }, [saveProject, filters, matchedIds])

  /**
   * Loads a saved project: marks it active in useProjects and re-applies its
   * filter snapshot to useQuery so buildings re-highlight immediately.
   */
  const handleLoadProject = useCallback((project) => {
    loadProject(project)
    loadFilters(project.filters)
  }, [loadProject, loadFilters])

  if (loading) return <LoadingScreen />

  if (buildingsError) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        Error: {buildingsError}
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CityScene
        buildings={buildings}
        selectedBuildingId={selectedBuilding?.id ?? null}
        matchedIds={matchedIds}
        onBuildingClick={handleBuildingClick}
      />

      <BuildingInfoPanel
        building={selectedBuilding}
        onClose={handleClosePanel}
      />

      {/* Zoning legend — top right, hides when info panel is showing */}
      <ZoningLegend visible={!selectedBuilding} />

      {/* Project panel — bottom left */}
      <ProjectPanel
        projects={projects}
        loading={projectsLoading}
        currentUsername={currentUsername}
        setCurrentUsername={setCurrentUsername}
        activeProjectId={activeProjectId}
        hasActiveQuery={matchedIds.length > 0}
        onSave={handleSaveProject}
        onLoad={handleLoadProject}
        onDelete={deleteProject}
      />

      {/* Query bar — bottom center */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}>
        <QueryInput
          onSubmit={submitQuery}
          loading={queryLoading}
          error={queryError}
          methodUsed={methodUsed}
        />
      </div>

      {/* Status badge — top left */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'var(--bg-panel)',
        color: 'var(--text-secondary)',
        border: 'var(--border-panel)',
        borderRadius: 'var(--radius-panel)',
        boxShadow: 'var(--shadow-panel)',
        padding: '6px 12px',
        fontFamily: 'var(--sans)',
        fontSize: 10,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: '0.02em',
        pointerEvents: 'none',
      }}>
        {matchedIds.length > 0
          ? `Beltline, Calgary \u2014 ${matchedIds.length} / ${buildings.length} matched`
          : `Beltline, Calgary \u2014 ${buildings.length} buildings loaded`}
      </div>
    </div>
  )
}

export default App
