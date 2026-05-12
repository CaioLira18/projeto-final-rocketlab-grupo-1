import { useState, useEffect, useCallback } from "react"

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

// valores exatos conforme gravados no banco
const ESTADOS_OPCOES = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
  "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
  "Mato Grosso", "Mato Grosso Do Sul", "Minas Gerais", "Pará",
  "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio De Janeiro",
  "Rio Grande Do Norte", "Rio Grande Do Sul", "Rondônia", "Roraima",
  "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
]


const GENEROS_OPCOES = ["Masculino", "Feminino", "Não Informado"]

// ── componentes auxiliares ─────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className={`text-3xl font-bold tracking-tight ${valueClass}`}>
          {value}
        </p>
      </div>
      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
        {icon}
      </div>
    </div>
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
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-all duration-150
        ${active
          ? "bg-blue-50 border-blue-200 text-blue-700"
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      {label}
      {active && (
        <span className="text-blue-400 hover:text-blue-600 leading-none">
          &times;
        </span>
      )}
    </button>
  )
}

const GenderBadge = ({ g }: { g: string }) => {
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

// ── componente principal ───────────────────────────────────────────────────
export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState("")
  const [buscaDebounced, setBuscaDebounced] = useState("")
  const [estados, setEstados] = useState<string[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [generos, setGeneros] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)

  // ── debounce da busca ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  // ── busca na API ─────────────────────────────────────────────────────────
  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setErro(null)

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const params = new URLSearchParams()

      if (buscaDebounced) params.set("busca", buscaDebounced)

      estados.forEach((e) => params.append("estado", e))
      origens.forEach((o) => params.append("origem", o))
      generos.forEach((g) => params.append("genero", g))

      params.set("skip", String((pagina - 1) * PER_PAGE))
      params.set("limit", String(PER_PAGE))

      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, {
        method: "GET",
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
  }, [buscaDebounced, estados, origens, generos, pagina])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  // ── reset página ao mudar filtros/busca ──────────────────────────────────
  useEffect(() => {
    setPagina(1)
  }, [buscaDebounced, estados, origens, generos])

  const toggleEstado = (e: string) =>
    setEstados((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])

  const toggleOrigem = (o: string) =>
    setOrigens((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])

  const toggleGenero = (g: string) =>
    setGeneros((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const limparFiltros = () => {
    setEstados([])
    setOrigens([])
    setGeneros([])
    setBusca("")
    setPagina(1)
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtrosAtivos = estados.length + origens.length + generos.length
  const primeiroItem = total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1
  const ultimoItem = Math.min(pagina * PER_PAGE, total)

  // ── exportar CSV ─────────────────────────────────────────────────────────
  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")

      const res = await fetch(`${API_BASE}/export/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) throw new Error("Sessão expirada.")
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
      console.error(e)
      alert(e.message ?? "Erro ao exportar CSV")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/60 p-6 space-y-6 font-sans">

      {/* ── cabeçalho ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-h1 text-primary">Clientes</h1>
          <p className="text-body-2 text-gray-500 mt-1">
            Visualize e gerencie sua base de clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            AS
          </div>
        </div>
      </div>

      {/* ── cards de estatísticas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 11a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
          }
          label="Total de Clientes"
          value={total.toLocaleString("pt-BR")}
        />
        <StatCard
          icon={
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
          label="Novos este mês"
          value="-----"
          valueClass="text-emerald-600"
        />
      </div>

      {/* ── painel de busca e filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">

        {/* busca + exportar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por ID, nome ou e-mail..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
          </div>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* chips de filtro */}
        <div className="space-y-2">

          {/* estados */}
          <div className="flex flex-wrap gap-2 items-start">
            <span className="text-xs font-medium text-gray-400 w-14 shrink-0 pt-1">Estado:</span>
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

          {/* gênero */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-medium text-gray-400 w-14 shrink-0">Gênero:</span>
            {GENEROS_OPCOES.map((g) => (
              <FilterChip
                key={g}
                label={g}
                active={generos.includes(g)}
                onClick={() => { toggleGenero(g); setPagina(1) }}
              />
            ))}
          </div>

          {/* limpar filtros */}
          {filtrosAtivos > 0 && (
            <div className="pt-1">
              <button
                onClick={limparFiltros}
                className="text-xs text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors"
              >
                Limpar todos os filtros ({filtrosAtivos})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── erro ── */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {erro}
        </div>
      )}

      {/* ── tabela ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["ID DO CLIENTE", "NOME", "E-MAIL", "TELEFONE", "GÊNERO", "CIDADE", "ESTADO"].map((col) => (
                  <th
                    key={col}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                clientes.map((c, i) => (
                  <tr
                    key={c.id_cliente}
                    className={`transition-colors hover:bg-blue-50/40 cursor-pointer ${i % 2 === 0 ? "" : "bg-gray-50/30"
                      }`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {c.id_cliente}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800 whitespace-nowrap">
                      {c.nome_cliente} {c.sobrenome_cliente}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {c.email_cliente}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                      {c.telefone_cliente}
                    </td>
                    <td className="px-5 py-3.5">
                      <GenderBadge g={c.genero_cliente} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {c.cidade_cliente}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                        {c.estado_cliente}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* paginação */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {total === 0
              ? "Nenhum cliente encontrado"
              : `Mostrando ${primeiroItem}–${ultimoItem} de ${total} clientes`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ←
            </button>
            <span className="px-3 text-sm text-gray-600">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Clientes
