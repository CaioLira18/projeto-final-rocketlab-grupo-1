import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LifeBuoy,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/context"
import { Button, Logo } from "@/components/ui"
import { cn } from "@/utils/cn"

export function NavBar() {
  const { user, logout } = useAuth()

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/produtos", label: "Produtos", icon: Package },
    { to: "/pedidos", label: "Pedidos", icon: ShoppingCart },
    { to: "/suporte", label: "Suporte", icon: LifeBuoy },
    { to: "/ai-agent", label: "Agente IA", icon: Sparkles, accentIcon: true },
  ]

  return (
    <aside className="w-64 bg-primary text-white flex flex-col justify-between border-r border-primary-400 h-screen sticky top-0 select-none">
      <div className="p-6">
        <NavLink
          to="/"
          aria-label="Ir para o Dashboard"
          className="flex items-center justify-center mb-8 rounded-lg transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          <Logo className="h-9 w-auto text-white" />
        </NavLink>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-body-2 font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-secondary text-white shadow-md shadow-secondary/20 font-semibold"
                    : "text-gray-300 hover:bg-primary-400 hover:text-white",
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                        !isActive && item.accentIcon && "text-secondary-300",
                      )}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-primary-400">
        <div className="flex items-center gap-2.5 mb-4 overflow-hidden">
          <div className="h-9 w-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-body-2-bold shrink-0">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-body-2-bold text-white truncate">{user?.username || "Usuário"}</p>
            <p className="text-caption text-gray-400 truncate">Sessão Ativa</p>
          </div>
        </div>

        <Button
          variant="ghost"
          intent="error"
          leftIcon={<LogOut />}
          onClick={logout}
          className="w-full text-error-300 font-medium hover:text-white hover:bg-error/10 border border-transparent hover:border-error-400/20"
        >
          Sair da conta
        </Button>
      </div>
    </aside>
  )
}
export default NavBar
