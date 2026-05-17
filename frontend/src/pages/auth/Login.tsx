import { useState, type FormEvent } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/context"
import { Button, Input, Logo } from "@/components/ui"

interface LoginLocationState {
  registered?: boolean
  email?: string
}

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? null) as LoginLocationState | null

  const [email, setEmail] = useState(locationState?.email ?? "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    locationState?.registered ? "Conta criada com sucesso! Faça login para continuar." : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setError("O e-mail é obrigatório")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("E-mail inválido. Por favor, insira um formato de e-mail válido (exemplo: usuario@dominio.com).")
      return
    }
    if (!password) {
      setError("A senha é obrigatória")
      return
    }

    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate("/")
    } catch (err: any) {
      setError(err.message || "E-mail ou senha incorretos")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC] select-none">
      
      <div className="w-full md:w-1/2 bg-[#0B1120] text-white p-8 md:p-10 flex flex-col justify-between min-h-85 md:min-h-screen">
        <Logo className="h-8 w-auto text-white" />

        <div className="max-w-120 my-auto space-y-4">
          <h1 className="text-h1 md:text-[40px] font-heading font-bold leading-tight">
            Uma única visão de cliente.<br />
            Para todos os times.
          </h1>
          <p className="text-body-2 text-gray-400 leading-relaxed font-sans">
            CRM 360 com dados unificados de clientes, pedidos, produtos e suporte - potencializado por um agente de IA conversacional.
          </p>
        </div>

        <div className="text-caption text-gray-500">
          © 2026 v commerce · StackOverGol
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 min-h-125">
        <div className="w-full max-w-95 flex flex-col">
          
          <div className="mb-8">
            <h2 className="text-h2 text-gray-900 font-heading font-bold tracking-tight">
              Entrar na plataforma
            </h2>
            <p className="text-body-2 text-gray-500 mt-1">
              Acesse sua conta para continuar.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-3.5 bg-success-50 border-l-4 border-success rounded-r-lg text-success text-caption font-semibold leading-relaxed">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3.5 bg-error-50 border-l-4 border-error rounded-r-lg text-error text-caption font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              label="E-mail"
              type="text"
              placeholder="seunome@stackovergol.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              labelAction={
                <span
                  title="Entre em contato com o administrador do sistema"
                  className="text-caption font-semibold text-gray-400 cursor-default"
                >
                  Esqueci minha senha
                </span>
              }
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 font-semibold shadow-sm transition-transform active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="text-body-2 text-gray-500 text-center mt-8 leading-normal font-sans">
            Ainda não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-action font-semibold hover:underline transition-all duration-200"
            >
              Criar conta
            </Link>
          </div>

          <div className="text-caption text-gray-400 text-center mt-4 leading-normal font-sans">
            Ao entrar, você concorda com os{" "}
            <span className="text-gray-600 hover:underline cursor-pointer">Termos</span>{" "}
            e a{" "}
            <span className="text-gray-600 hover:underline cursor-pointer">Política de Privacidade</span>.
          </div>

        </div>
      </div>

    </div>
  )
}
export default Login
