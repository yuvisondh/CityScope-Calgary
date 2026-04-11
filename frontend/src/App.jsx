import { useBuildings } from './hooks/useBuildings'
import LoadingScreen from './components/LoadingScreen'

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
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      Loaded {buildings.length} buildings
    </div>
  )
}

export default App
