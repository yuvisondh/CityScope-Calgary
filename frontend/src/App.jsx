import { useBuildings } from './hooks/useBuildings'
import LoadingScreen from './components/LoadingScreen'
import CityScene from './components/CityScene'

function App() {
  const { buildings, loading, error } = useBuildings()

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
      <CityScene buildings={buildings} />
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
