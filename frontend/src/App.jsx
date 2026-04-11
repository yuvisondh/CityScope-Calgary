import { useState, useCallback } from 'react'
import { useBuildings } from './hooks/useBuildings'
import LoadingScreen from './components/LoadingScreen'
import CityScene from './components/CityScene'
import BuildingInfoPanel from './components/BuildingInfoPanel'

function App() {
  const { buildings, loading, error } = useBuildings()
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  // useCallback: stable references keep React.memo on BuildingMesh effective
  const handleBuildingClick = useCallback((building) => {
    setSelectedBuilding(building)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedBuilding(null)
  }, [])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: 'red' }}>
        Error: {error}
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <CityScene
        buildings={buildings}
        selectedBuildingId={selectedBuilding?.id ?? null}
        onBuildingClick={handleBuildingClick}
      />

      <BuildingInfoPanel
        building={selectedBuilding}
        onClose={handleClosePanel}
      />

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
        {buildings.length} buildings loaded
      </div>
    </div>
  )
}

export default App
