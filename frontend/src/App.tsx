import './App.css'
import { Outlet } from "react-router-dom"

function App() {

  return (
    <div style={{ display: "flex" }}>
      <div style={{ flex: 1 }}>
        <main><Outlet /></main>
      </div>
    </div>
  )
}

export default App
