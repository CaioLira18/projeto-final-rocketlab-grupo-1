import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom"
import App from "@/App"
import { Home } from "@/pages/Home"
import { Produtos } from "@/pages/produtos"
import { Pedidos } from "@/pages/pedidos"
import { Suporte } from "@/pages/suporte"
import { Clientes } from "@/pages/clientes"
import { Login } from "@/pages/auth"
import { AuthProvider, useAuth } from "@/context"
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

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
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
export { router }