import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "../App"
import { Home } from "../pages/Home"


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/",       element: <Home />},
      {/* Outras Rotas */}
    ],
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}