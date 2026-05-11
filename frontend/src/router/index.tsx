import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom"
import App from "../App"
import { Home } from "../pages/Home"
import { Produtos } from "@/pages/produtos/Produtos"
import { Pedidos } from "@/pages/pedidos/Pedidos"
import { Suporte } from "@/pages/suporte/Suporte"
import { Clientes } from "@/pages/clientes/Clientes"
import { Login } from "@/pages/auth"
import { AuthProvider, useAuth } from "@/context"

// Guard de Rotas para impedir acesso a usuários não autenticados
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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          { path: "/", element: <Home /> },
          { path: "/clientes", element: <Clientes /> },
          { path: "/produtos", element: <Produtos /> },
          { path: "/pedidos", element: <Pedidos /> },
          { path: "/suporte", element: <Suporte /> },
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

