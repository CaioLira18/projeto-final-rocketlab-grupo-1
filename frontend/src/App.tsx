import { Outlet } from "react-router-dom"
import { NavBar } from "./components/layout/NavBar"
import './index.css'

function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      <NavBar />
      <main style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
