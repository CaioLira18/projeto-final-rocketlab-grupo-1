import { useNavigate } from "react-router-dom"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context"
import { Button } from "@/components/ui"

export function Unauthorized() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const roleNameMap: Record<string, string> = {
    admin: "Administrador",
    gerente_comercial: "Gerente Comercial",
    analista_crm: "Analista de CRM",
    operador_suporte: "Operador de Suporte",
    operador_produtos: "Operador de Produtos",
  }

  const userRole = user?.role ?? "Visitante"
  const userRoleDisplay = roleNameMap[userRole] ?? userRole

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center space-y-6 relative overflow-hidden">
        {/* Glow Decorativo de Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-error-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Ícone com animação */}
        <div className="relative inline-flex items-center justify-center p-5 bg-error-50 text-error rounded-full ring-8 ring-error-50/50 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-h2 font-heading font-bold text-gray-900 tracking-tight">
            Acesso Restrito
          </h1>
          <p className="text-body-2 text-gray-500 max-w-sm mx-auto">
            Desculpe, o seu perfil não tem permissão para visualizar este recurso.
          </p>
        </div>

        {/* Informações da conta atual */}
        <div className="bg-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-xl p-4 text-left space-y-2 text-caption">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Usuário:</span>
            <span className="text-gray-800 font-bold">{user?.username ?? "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-medium">Perfil atual:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-error-50 text-error">
              {userRoleDisplay}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => navigate("/")}
            size="lg"
            leftIcon={<ArrowLeft />}
            className="w-full font-semibold shadow-sm"
          >
            Ir para Minha Área
          </Button>
        </div>

        <div className="text-[11px] text-gray-400 font-sans pt-2">
          Se você acredita que isso é um engano, entre em contato com o suporte ou com seu administrador do sistema.
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
