import { useState, useEffect, useCallback } from "react"
import {
  Users,
  UserPlus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui"

const API_BASE = "http://localhost:8000"
const PER_PAGE = 20

// ── tipos ──────────────────────────────────────────────────────────────────
interface Cliente {
  id_cliente: string
  nome_cliente: string
  sobrenome_cliente: string
  email_cliente: string
  telefone_cliente: string
  genero_cliente: string
  cidade_cliente: string
  estado_cliente: string
  pais_cliente: string
  origem_cliente: string
  idade: number
}

// ── constantes ─────────────────────────────────────────────────────────────
const ESTADOS_OPCOES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
  "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
  "Mato Grosso", "Mato Grosso Do Sul", "Minas Gerais", "Pará",
  "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio De Janeiro",
  "Rio Grande Do Norte", "Rio Grande Do Sul", "Rondônia", "Roraima",
  "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
]

const GENEROS_OPCOES = ["Masculino", "Feminino", "Não Informado"]

// ── helpers ────────────────────────────────────────────────────────────────
const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value)

// ── subcomponentes ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 text-secondary animate-spin" />
      <p className="text-body-2 text-gray-500">Carregando base de clientes...</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center p-6 bg-error-50 rounded-xl border border-error-100 max-w-2xl mx-auto text-center space-y-4">
      <AlertCircle className="h-12 w-12 text-error" />
      <div>
        <h3 className="text-h3 text-error-500 font-bold">Falha na Comunicação</h3>
        <p className="text-body-2 text-gray-600 mt-1">{error}</p>
      </div>
      <Button onClick={onRetry} className="bg-error hover:bg-error-400 text-white">
        Tentar novamente
      </Button>
    </div>
  )
}

interface ClienteCardKPIProps {
  title: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

function ClienteCardKPI({ title, value, icon: Icon, iconBg, iconColor }: ClienteCardKPIProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-caption text-gray-500 font-medium">{title}</p>
        <p className="text-h2 font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function GenderBadge({ g }: { g: string }) {
  const color =
    g === "Feminino"
      ? "bg-pink-50 text-pink-600"
      : g === "Masculino"
        ? "bg-blue-50 text-blue-600"
        : "bg-gray-100 text-gray-500"
  const label = g === "Feminino" ? "F" : g === "Masculino" ? "M" : "?"
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>
      {label}
    </span>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150
        ${active
          ? "bg-primary-50 border-primary-200 text-primary"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      {label}
      {active && <X className="h-3 w-3 ml-0.5 opacity-60" />}
    </button>
  )
}

// ── componente principal ───────────────────────────────────────────────────
export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState("")
  const [buscaDebounced, setBuscaDebounced] = useState("")
  const [estados, setEstados] = useState<string[]>([])
  const [generos, setGeneros] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const params = new URLSearchParams()
      if (buscaDebounced) params.set("busca", buscaDebounced)
      estados.forEach((e) => params.append("estado", e))
      generos.forEach((g) => params.append("genero", g))
      params.set("skip", String((pagina - 1) * PER_PAGE))
      params.set("limit", String(PER_PAGE))

      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const data = await res.json()

      if (Array.isArray(data)) {
        setClientes(data)
        setTotal(data.length)
      } else {
        const lista = data.clientes ?? data.items ?? []
        setClientes(lista)
        setTotal(data.total ?? data.count ?? lista.length)
      }
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar clientes")
      setClientes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buscaDebounced, estados, generos, pagina])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  useEffect(() => { setPagina(1) }, [buscaDebounced, estados, generos])

  const toggleEstado = (e: string) =>
    setEstados((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  const toggleGenero = (g: string) =>
    setGeneros((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const limparFiltros = () => {
    setEstados([])
    setGeneros([])
    setBusca("")
    setPagina(1)
  }

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/export/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Erro ao exportar CSV")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? "Erro ao exportar CSV")
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtrosAtivos = estados.length + generos.length
  const primeiroItem = total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1
  const ultimoItem = Math.min(pagina * PER_PAGE, total)

  // paginação com reticências (mesmo padrão de Produtos)
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, pagina - 1)
      let end = Math.min(totalPaginas - 1, pagina + 1)
      if (pagina <= 3) { end = 4 }
      else if (pagina >= totalPaginas - 2) { start = totalPaginas - 3 }
      if (start > 2) pages.push("...")
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPaginas - 1) pages.push("...")
      pages.push(totalPaginas)
    }
    return pages
  }

  return (
    <div className="space-y-6">

      {/* ── cabeçalho ── */}
      <div>
        <h1 className="text-h1 text-primary">Clientes</h1>
        <p className="text-body-2 text-gray-500 mt-1">
          Visualize e gerencie sua base de clientes
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : erro ? (
        <ErrorState error={erro} onRetry={fetchClientes} />
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClienteCardKPI
              title="Total de Clientes"
              value={formatNumber(total)}
              icon={Users}
              iconBg="bg-primary-50"
              iconColor="text-primary"
            />
            <ClienteCardKPI
              title="Novos este Mês"
              value="—"
              icon={UserPlus}
              iconBg="bg-success-50"
              iconColor="text-success"
            />
          </div>

          {/* ── Barra de filtros ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            {/* busca + exportar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por ID, nome ou e-mail..."
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200"
                />
              </div>
              <Button
                size="lg"
                intent="secondary"
                leftIcon={<Download className="h-5 w-5" />}
                onClick={exportCSV}
              >
                Exportar CSV
              </Button>
            </div>

            {/* filtro por gênero */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Gênero:</span>
              {GENEROS_OPCOES.map((g) => (
                <FilterChip
                  key={g}
                  label={g}
                  active={generos.includes(g)}
                  onClick={() => { toggleGenero(g); setPagina(1) }}
                />
              ))}
            </div>

            {/* filtro por estado */}
            <div className="flex flex-wrap items-start gap-2">
              <span className="text-caption font-medium text-gray-400 w-14 shrink-0 pt-1">Estado:</span>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS_OPCOES.map((e) => (
                  <FilterChip
                    key={e}
                    label={e}
                    active={estados.includes(e)}
                    onClick={() => { toggleEstado(e); setPagina(1) }}
                  />
                ))}
              </div>
            </div>

            {filtrosAtivos > 0 && (
              <div className="pt-1">
                <button
                  onClick={limparFiltros}
                  className="text-caption text-gray-400 hover:text-error underline underline-offset-2 transition-colors"
                >
                  Limpar todos os filtros ({filtrosAtivos})
                </button>
              </div>
            )}
          </div>

          {/* ── Tabela ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {clientes.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                Nenhum cliente encontrado para os filtros selecionados.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {[
                          "ID do Cliente",
                          "Nome",
                          "E-mail",
                          "Telefone",
                          "Gênero",
                          "Cidade",
                          "Estado",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientes.map((c) => (
                        <tr
                          key={c.id_cliente}
                          className="hover:bg-gray-50/50 transition-colors duration-150 text-body-2 text-gray-700 cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 tracking-tight">
                            {c.id_cliente}
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {c.nome_cliente} {c.sobrenome_cliente}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {c.email_cliente}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {c.telefone_cliente}
                          </td>
                          <td className="px-6 py-4">
                            <GenderBadge g={c.genero_cliente} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {c.cidade_cliente}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                              {c.estado_cliente}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Paginação (mesmo padrão de Produtos) ── */}
                <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                  <div className="text-caption text-gray-500 font-medium order-2 sm:order-1">
                    Mostrando{" "}
                    <span className="font-semibold text-gray-700">{primeiroItem}</span> a{" "}
                    <span className="font-semibold text-gray-700">{ultimoItem}</span> de{" "}
                    <span className="font-semibold text-gray-700">{formatNumber(total)}</span> clientes
                  </div>
                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    <button
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina === 1}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                      title="Página Anterior"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                    </button>

                    {getPageNumbers().map((page, idx) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`ellipsis-${idx}`}
                            className="px-2 text-gray-400 font-bold select-none text-caption flex items-center justify-center"
                          >
                            ...
                          </span>
                        )
                      }
                      return (
                        <button
                          key={`page-${page}`}
                          onClick={() => setPagina(page as number)}
                          className={`h-8 w-8 rounded-lg text-caption font-semibold transition-all duration-150 cursor-pointer ${
                            pagina === page
                              ? "bg-primary text-white shadow-sm"
                              : "text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina === totalPaginas}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                      title="Próxima Página"
                    >
                      <ChevronRight className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Clientes
