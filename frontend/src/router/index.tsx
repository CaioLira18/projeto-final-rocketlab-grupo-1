import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "../App"
import { Home } from "../pages/Home"
import { Produtos } from "@/pages/produtos/Produtos"
import { Pedidos } from "@/pages/pedidos/Pedidos"
import { Suporte } from "@/pages/suporte/Suporte"
import { Clientes } from "@/pages/clientes/Clientes"


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/",       element: <Home />},
      { path: "/clientes",       element: <Clientes />},
      { path: "/produtos",       element: <Produtos />},
      { path: "/pedidos",       element: <Pedidos />},
      { path: "/suporte",       element: <Suporte />},
      {/* Outras Rotas */}
    ],
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
