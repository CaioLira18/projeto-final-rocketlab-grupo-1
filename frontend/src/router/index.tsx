import { type ReactNode } from "react"
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom"
import App from "@/App"
import { Home } from "@/pages/Home"
import { Produtos } from "@/pages/produtos"
import { Pedidos } from "@/pages/pedidos"
import { Suporte } from "@/pages/suporte"
import { Clientes } from "@/pages/clientes"
import { AiAgent } from "@/pages/ai-agent"
import { Login, Register } from "@/pages/auth"
import { AuthProvider, useAuth } from "@/context"
import { usePermission, type Capability } from "@/hooks"
import ButtonsShowcase from "@/pages/dev/ButtonsShowcase"

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Ordem de fallback caso a role corrente não tenha acesso ao Dashboard.
// O primeiro item com permissão é escolhido como rota inicial.
const FALLBACK_ROUTES: Array<{ path: string; capability: Capability }> = [
  { path: "/clientes", capability: "clientes.read" },
  { path: "/suporte", capability: "suporte.read" },
  { path: "/produtos", capability: "produtos.read" },
  { path: "/pedidos", capability: "pedidos.read" },
  { path: "/ai-agent", capability: "chat.use" },
]

// Renderiza a Home (Dashboard) para quem tem permissão e redireciona os demais para a primeira área acessível.
function HomeOrFallback() {
  const { can } = usePermission()
  if (can("dashboard.view")) return <Home />
  const target = FALLBACK_ROUTES.find((route) => can(route.capability))
  return <Navigate to={target?.path ?? "/login"} replace />
}

// Gate por capacidade aplicado a uma rota individual. Roles sem permissão são redirecionadas para a Home.
function RequireCapability({ capability, children }: { capability: Capability; children: ReactNode }) {
  const { can } = usePermission()
  if (!can(capability)) return <Navigate to="/" replace />
  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/botoes-teste",
    element: <ButtonsShowcase />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          { path: "/", element: <HomeOrFallback /> },
          { path: "/clientes", element: <RequireCapability capability="clientes.read"><Clientes /></RequireCapability> },
          { path: "/produtos", element: <RequireCapability capability="produtos.read"><Produtos /></RequireCapability> },
          { path: "/pedidos", element: <RequireCapability capability="pedidos.read"><Pedidos /></RequireCapability> },
          { path: "/suporte", element: <RequireCapability capability="suporte.read"><Suporte /></RequireCapability> },
          { path: "/ai-agent", element: <RequireCapability capability="chat.use"><AiAgent /></RequireCapability> },
        ],
      },
    ],
  },
])

export default function Router() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
export { router }