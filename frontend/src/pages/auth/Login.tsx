import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context"
import { Button, Input } from "@/components/ui"

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("O e-mail é obrigatório")
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
      
      <div className="w-full md:w-1/2 bg-[#0B1120] text-white p-8 md:p-10 flex flex-col justify-between min-h-[340px] md:min-h-screen">
        <div className="text-subtitle-1 font-heading font-bold tracking-wide">
          V-Commerce
        </div>

        <div className="max-w-[480px] my-auto space-y-4">
          <h1 className="text-h1 md:text-[40px] font-heading font-bold leading-tight">
            Uma única visão de cliente.<br />
            Para todos os times.
          </h1>
          <p className="text-body-2 text-gray-400 leading-relaxed font-sans">
            CRM 360 com dados unificados de clientes, pedidos, produtos e suporte — potencializado por um agente de IA conversacional.
          </p>
        </div>

        <div className="text-caption text-gray-500">
          © 2026 V-Commerce
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 min-h-[500px]">
        <div className="w-full max-w-[380px] flex flex-col">
          
          <div className="mb-8">
            <h2 className="text-h2 text-gray-900 font-heading font-bold tracking-tight">
              Entrar na plataforma
            </h2>
            <p className="text-body-2 text-gray-500 mt-1">
              Acesse sua conta para continuar.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-error-50 border-l-4 border-error rounded-r-lg text-error text-caption font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              label="E-mail"
              type="text"
              placeholder="ana.souza@v-commerce.com"
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
                  onClick={() => alert("Funcionalidade de recuperação de senha em desenvolvimento.")}
                  className="text-caption font-semibold text-action hover:underline cursor-pointer transition-all duration-200"
                >
                  Esqueci minha senha
                </span>
              }
              required
            />

            <Button
              type="submit"
              intent="action"
              size="md"
              className="w-full mt-2 font-semibold shadow-sm transition-transform active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="text-caption text-gray-400 text-center mt-8 leading-normal font-sans">
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
