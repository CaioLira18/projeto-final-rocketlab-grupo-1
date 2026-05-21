import { useAuth } from "@/context"

// Lista de capacidades reconhecidas pelo sistema (deve refletir a matriz RBAC do README).
export type Capability =
  | "dashboard.view"
  | "clientes.read"
  | "clientes.view360"
  | "pedidos.read"
  | "produtos.read"
  | "produtos.write"
  | "suporte.read"
  | "export.run"
  | "chat.use"

// Matriz role → capacidades. Mantida em sincronia com backend/app/routes/dependencies.py.
// A role 'admin' é tratada à parte: tem acesso a tudo.
const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  gerente_comercial: [
    "dashboard.view",
    "clientes.read",
    "clientes.view360",
    "pedidos.read",
    "produtos.read",
    "suporte.read",
    "export.run",
    "chat.use",
  ],
  analista_crm: [
    "dashboard.view",
    "clientes.read",
    "clientes.view360",
    "pedidos.read",
    "produtos.read",
    "suporte.read",
    "export.run",
    "chat.use",
  ],
  operador_suporte: [
    "clientes.read",
    "pedidos.read",
    "produtos.read",
    "suporte.read",
  ],
  analista_operacoes: [
    "clientes.read",
    "pedidos.read",
    "produtos.read",
  ],
  gerente_produtos: [
    "produtos.read",
    "produtos.write",
    "export.run",
  ],
}

// Hook para checar se o usuário autenticado pode executar uma capacidade.
// Admin sempre passa. Roles desconhecidas não recebem nada.
export function usePermission() {
  const { user } = useAuth()

  const can = (capability: Capability): boolean => {
    if (!user) return false
    if (user.role === "admin") return true
    const caps = ROLE_CAPABILITIES[user.role] ?? []
    return caps.includes(capability)
  }

  const canAny = (capabilities: Capability[]): boolean =>
    capabilities.some((c) => can(c))

  return { can, canAny, role: user?.role ?? null }
}
