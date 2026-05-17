import { useState, type FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context"
import { Button, Input, Logo } from "@/components/ui"

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()

    if (!trimmedUsername) {
      setError("O nome de usuário é obrigatório")
      return
    }
    if (trimmedUsername.length < 3) {
      setError("O nome de usuário deve ter ao menos 3 caracteres")
      return
    }
    if (!trimmedEmail) {
      setError("O e-mail é obrigatório")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError("E-mail inválido. Por favor, insira um formato válido (exemplo: usuario@dominio.com).")
      return
    }
    if (!password) {
      setError("A senha é obrigatória")
      return
    }
    if (password.length < 6) {
      setError("A senha deve ter ao menos 6 caracteres")
      return
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    setIsSubmitting(true)
    try {
      await register({ username: trimmedUsername, email: trimmedEmail, password })
      // Sucesso: leva ao login com flag para exibir mensagem de boas-vindas.
      navigate("/login", { state: { registered: true, email: trimmedEmail } })
    } catch (err: any) {
      setError(err.message || "Não foi possível concluir o cadastro. Tente novamente.")
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
            Crie sua conta.<br />
            Comece a transformar dados em decisões.
          </h1>
          <p className="text-body-2 text-gray-400 leading-relaxed font-sans">
            Cadastre-se gratuitamente e tenha acesso ao CRM 360 com agente de IA conversacional. Um time, uma visão.
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
              Criar conta
            </h2>
            <p className="text-body-2 text-gray-500 mt-1">
              Preencha seus dados para começar.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-error-50 border-l-4 border-error rounded-r-lg text-error text-caption font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Nome de usuário"
              type="text"
              placeholder="seu.nome"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              autoComplete="username"
              required
            />

            <Input
              label="E-mail"
              type="email"
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
              autoComplete="new-password"
              required
            />

            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 font-semibold shadow-sm transition-transform active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <div className="text-body-2 text-gray-500 text-center mt-8 leading-normal font-sans">
            Já possui uma conta?{" "}
            <Link
              to="/login"
              className="text-action font-semibold hover:underline transition-all duration-200"
            >
              Entrar
            </Link>
          </div>

          <div className="text-caption text-gray-400 text-center mt-4 leading-normal font-sans">
            Ao criar sua conta, você concorda com os{" "}
            <span className="text-gray-600 hover:underline cursor-pointer">Termos</span>{" "}
            e a{" "}
            <span className="text-gray-600 hover:underline cursor-pointer">Política de Privacidade</span>.
          </div>

        </div>
      </div>

    </div>
  )
}
export default Register
