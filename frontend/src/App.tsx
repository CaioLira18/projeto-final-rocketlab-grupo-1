import { Outlet } from "react-router-dom"
import { NavBar } from "@/components/layout"

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-dark font-sans">
      {/* Painel Lateral de Navegação */}
      <NavBar />

      {/* Área do Conteúdo Principal */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-y-auto">
        <div className="flex-1 p-8 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default App
