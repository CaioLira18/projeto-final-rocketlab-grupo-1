import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  LifeBuoy,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/context"
import { usePermission, type Capability } from "@/hooks"
import { Button, Logo } from "@/components/ui"
import { cn } from "@/utils/cn"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  gerente_comercial: "Gerente Comercial",
  analista_crm: "Analista de CRM",
  analista_operacoes: "Analista de Operações",
  gerente_produtos: "Gerente de Produtos",
  operador_suporte: "Operador de Suporte",
}

// Capacidade necessária para cada item do menu. Mantido em sincronia com a matriz de permissões.
const NAV_ITEM_CAPABILITY: Record<string, Capability> = {
  "/dashboard": "dashboard.view",
  "/clientes": "clientes.read",
  "/produtos": "produtos.read",
  "/pedidos": "pedidos.read",
  "/suporte": "suporte.read",
  "/ai-agent": "chat.use",
}

export function NavBar() {
  const { user, logout } = useAuth()
  const { can } = usePermission()
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    return saved ? JSON.parse(saved) : false
  })

  const handleToggle = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(nextState))
  }

  const allNavItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/clientes", label: "Clientes", icon: Users },
    { to: "/produtos", label: "Produtos", icon: Package },
    { to: "/pedidos", label: "Pedidos", icon: ShoppingCart },
    { to: "/suporte", label: "Suporte", icon: LifeBuoy },
    { to: "/ai-agent", label: "Agente IA", icon: Sparkles, accentIcon: true },
  ]

  // Esconde do menu lateral as áreas que a role corrente não pode acessar.
  const navItems = allNavItems.filter((item) => can(NAV_ITEM_CAPABILITY[item.to]))

  return (
    <aside
      className={cn(
        "bg-primary text-white flex flex-col justify-between border-r border-primary-400 h-screen sticky top-0 select-none transition-all duration-300 ease-in-out z-30 shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("transition-all duration-300 flex flex-col", isCollapsed ? "p-4" : "p-6")}>
        {/* Linha de Controle do Topo (Botão de Alternância) */}
        <div className={cn("flex mb-4 transition-all duration-300", isCollapsed ? "justify-center" : "justify-end")}>
          <button
            onClick={handleToggle}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-primary-400/80 transition-all duration-200 shrink-0 shadow-sm border border-transparent hover:border-primary-300/10"
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Logotipo da marca, clicável e leva ao Dashboard */}
        <NavLink
          to="/dashboard"
          end
          aria-label="Ir para o Dashboard"
          className={cn(
            "flex items-center justify-center mb-8 rounded-lg transition-opacity duration-200 hover:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
          )}
        >
          <Logo compact={isCollapsed} className={isCollapsed ? "h-8 w-8" : "h-9 w-auto"} />
        </NavLink>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
                className={({ isActive }) => cn(
                  "flex items-center rounded-lg text-body-2 font-medium transition-all duration-200 group relative",
                  isCollapsed ? "justify-center px-0 w-12 h-12 mx-auto" : "gap-3 px-4 py-3",
                  isActive
                    ? "bg-secondary text-white shadow-md shadow-secondary/20 font-semibold"
                    : "text-gray-300 hover:bg-primary-400 hover:text-white",
                )}
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-transform duration-200 group-hover:scale-110 shrink-0",
                        !isActive && item.accentIcon && "text-secondary-300",
                      )}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div
        className={cn(
          "border-t border-primary-400 transition-all duration-300",
          isCollapsed ? "p-4" : "p-6"
        )}
      >
        <div className={cn("flex items-center gap-2.5 mb-4 overflow-hidden", isCollapsed && "justify-center")}>
          <div
            className="h-9 w-9 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-body-2-bold shrink-0 shadow-sm"
            title={isCollapsed ? `${user?.username || "Usuário"} (${ROLE_LABELS[user?.role || ""] || user?.role || "Sessão Ativa"})` : undefined}
          >
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-fade-in">
              <p className="text-body-2-bold text-white truncate">{user?.username || "Usuário"}</p>
              <p className="text-caption text-gray-400 truncate">
                {ROLE_LABELS[user?.role || ""] || user?.role || "Sessão Ativa"}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          intent="error"
          leftIcon={!isCollapsed ? <LogOut /> : undefined}
          onClick={logout}
          title={isCollapsed ? "Sair da conta" : undefined}
          className={cn(
            "text-error-300 font-medium hover:text-white hover:bg-error/10 border border-transparent hover:border-error-400/20 transition-all duration-200",
            isCollapsed ? "w-12 h-10 mx-auto px-0" : "w-full",
          )}
        >
          {isCollapsed ? <LogOut className="h-4 w-4" /> : "Sair da conta"}
        </Button>
      </div>
    </aside>
  )
}
export default NavBar
