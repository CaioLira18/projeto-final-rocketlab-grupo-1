import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiFetch } from "@/services"

interface Usuario {
  username: string
  is_active: boolean
}

interface LoginResponse {
  access_token: string
  token_type: string
}

interface AuthContextType {
  user: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const data = await apiFetch<Usuario>("/auth/me")
      setUser(data)
    } catch (err) {
      localStorage.removeItem("token")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      fetchProfile()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
      localStorage.setItem("token", data.access_token)
      await fetchProfile()
    } catch (err) {
      throw new Error("Usuário ou senha incorretos")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
