import { useState, useCallback } from 'react'
import { useBuildings } from './hooks/useBuildings'
import { useQuery } from './hooks/useQuery'
import LoadingScreen from './components/LoadingScreen'
import CityScene from './components/CityScene'
import BuildingInfoPanel from './components/BuildingInfoPanel'
import QueryInput from './components/QueryInput'

function App() {
  const { buildings, loading, error: buildingsError } = useBuildings()
  const { matchedIds, methodUsed, loading: queryLoading, error: queryError, submitQuery } = useQuery()
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  const handleBuildingClick = useCallback((building) => {
    setSelectedBuilding(building)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null)
  }, [])

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
        background: 'rgba(0,0,0,0.5)',
        color: '#fff',
        padding: '6px 12px',
        borderRadius: 6,
        fontFamily: 'sans-serif',
        fontSize: 13,
        pointerEvents: 'none',
      }}>
        {matchedIds.length > 0
          ? `${matchedIds.length} / ${buildings.length} buildings matched`
          : `${buildings.length} buildings loaded`}
      </div>
    </div>
  )
}

export default App
