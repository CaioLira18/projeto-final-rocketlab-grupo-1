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
  ChevronDown,
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

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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

// ── MultiSelect genérico reutilizável ──────────────────────────────────────
interface MultiSelectProps {
  opcoes: string[]
  selecionados: string[]
  onChange: (novos: string[]) => void
  placeholder: string
  buscavel?: boolean
}

function MultiSelect({ opcoes, selecionados, onChange, placeholder, buscavel = false }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [filtro, setFiltro] = useState("")

  const toggle = (v: string) =>
    onChange(selecionados.includes(v) ? selecionados.filter((x) => x !== v) : [...selecionados, v])

  const opcoesFiltradas = buscavel
    ? opcoes.filter((o) => o.toLowerCase().includes(filtro.toLowerCase()))
    : opcoes

  const label =
    selecionados.length === 0
      ? placeholder
      : selecionados.length === 1
        ? selecionados[0]
        : `${selecionados.length} selecionados`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setFiltro("") }}
        className={`flex items-center justify-between gap-2 w-full min-w-[190px] px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100
          ${open ? "border-primary bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"}
          ${selecionados.length > 0 ? "text-primary font-medium" : "text-gray-500"}`}
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selecionados.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
              onKeyDown={(e) => e.key === "Enter" && onChange([])}
              className="text-gray-300 hover:text-error transition-colors"
              title="Limpar"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {buscavel && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-100 focus:border-primary"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {opcoesFiltradas.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Nenhuma opção encontrada</p>
              ) : (
                opcoesFiltradas.map((o) => {
                  const checked = selecionados.includes(o)
                  return (
                    <label
                      key={o}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm
                        ${checked ? "bg-primary-50/60 text-primary font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o)}
                        className="accent-primary h-3.5 w-3.5 rounded"
                      />
                      {o}
                    </label>
                  )
                })
              )}
            </div>
            {selecionados.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => { onChange([]); setOpen(false) }}
                  className="text-xs text-error hover:underline"
                >
                  Limpar seleção ({selecionados.length})
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
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

  // ID exato
  const [buscaId, setBuscaId] = useState("")
  const [buscaIdDebounced, setBuscaIdDebounced] = useState("")

  // filtros de select
  const [cidades, setCidades] = useState<string[]>([])
  const [estados, setEstados] = useState<string[]>([])
  const [generos, setGeneros] = useState<string[]>([])

  // lista de cidades disponíveis (dinâmica)
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([])

  const [pagina, setPagina] = useState(1)

  const modoIdExato = buscaIdDebounced.trim().length > 0

  // debounces
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    const t = setTimeout(() => setBuscaIdDebounced(buscaId), 500)
    return () => clearTimeout(t)
  }, [buscaId])

  // ── fetch por ID exato → GET /clientes/{id} ────────────────────────────
  const fetchPorId = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const res = await fetch(
        `${API_BASE}/clientes/${encodeURIComponent(buscaIdDebounced.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
      if (res.status === 404) { setClientes([]); setTotal(0); return }
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const data: Cliente = await res.json()
      setClientes([data])
      setTotal(1)
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar cliente")
      setClientes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buscaIdDebounced])

  // ── fetch normal com filtros ───────────────────────────────────────────
  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const params = new URLSearchParams()
      if (buscaDebounced) params.set("busca", buscaDebounced)
      cidades.forEach((c) => params.append("cidade", c))
      estados.forEach((e) => params.append("estado", e))
      generos.forEach((g) => params.append("genero", g))
      params.set("skip", String((pagina - 1) * PER_PAGE))
      params.set("limit", String(PER_PAGE))

      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })

      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const data = await res.json()
      const lista: Cliente[] = Array.isArray(data) ? data : data.clientes ?? data.items ?? []
      const tot: number = Array.isArray(data) ? data.length : data.total ?? data.count ?? lista.length

      setClientes(lista)
      setTotal(tot)
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar clientes")
      setClientes([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buscaDebounced, cidades, estados, generos, pagina])

  // ── fetch para popular cidades disponíveis (sem filtro de cidade) ──────
  const fetchCidadesDisponiveis = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const params = new URLSearchParams()
      if (buscaDebounced) params.set("busca", buscaDebounced)
      estados.forEach((e) => params.append("estado", e))
      generos.forEach((g) => params.append("genero", g))
      params.set("limit", "500")

      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return

      const data = await res.json()
      const lista: Cliente[] = Array.isArray(data) ? data : data.clientes ?? data.items ?? []
      const unique = [...new Set(lista.map((c) => c.cidade_cliente).filter(Boolean))].sort() as string[]
      setCidadesDisponiveis(unique)
    } catch {
      // silencioso
    }
  }, [buscaDebounced, estados, generos])

  // popula cidades ao mudar filtros relevantes
  useEffect(() => {
    if (!modoIdExato) fetchCidadesDisponiveis()
  }, [buscaDebounced, estados, generos, modoIdExato, fetchCidadesDisponiveis])

  // fetch principal
  useEffect(() => {
    if (modoIdExato) fetchPorId()
    else fetchClientes()
  }, [modoIdExato, fetchPorId, fetchClientes])

  // reseta página ao mudar filtros
  useEffect(() => { setPagina(1) }, [buscaDebounced, buscaIdDebounced, cidades, estados, generos])

  const toggleGenero = (g: string) =>
    setGeneros((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const limparFiltros = () => {
    setEstados([])
    setGeneros([])
    setCidades([])
    setBusca("")
    setBuscaId("")
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
  const filtrosAtivos = estados.length + generos.length + cidades.length + (buscaId ? 1 : 0)
  const primeiroItem = total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1
  const ultimoItem = Math.min(pagina * PER_PAGE, total)

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
        <ErrorState error={erro} onRetry={modoIdExato ? fetchPorId : fetchClientes} />
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

            {/* Linha 1: busca geral + exportar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setPagina(1) }}
                  disabled={modoIdExato}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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

            {/* Linha 2: ID exato + Cidade (select dinâmico) */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* ID exato */}
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por ID exato do cliente..."
                  value={buscaId}
                  onChange={(e) => { setBuscaId(e.target.value); setPagina(1) }}
                  className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200
                    ${modoIdExato ? "border-primary bg-primary-50/20 font-medium text-primary" : "border-gray-200"}`}
                />
                {buscaId && (
                  <button
                    onClick={() => { setBuscaId(""); setPagina(1) }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Linha 3: gênero + estado */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />

              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Estado:</span>
                <MultiSelect
                  opcoes={ESTADOS_OPCOES}
                  selecionados={estados}
                  onChange={(novos) => { setEstados(novos); setPagina(1) }}
                  placeholder="Todos os estados"
                  buscavel
                />
              </div>

              {/* Cidade — select dinâmico */}
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Cidade:</span>
                <MultiSelect
                  opcoes={cidadesDisponiveis}
                  selecionados={cidades}
                  onChange={(novos) => { setCidades(novos); setPagina(1) }}
                  placeholder="Todas as cidades"
                  buscavel
                />
              </div>
            </div>

            {/* aviso modo ID exato */}
            {modoIdExato && (
              <p className="text-xs text-primary bg-primary-50/50 border border-primary-100 rounded-lg px-3 py-1.5">
                Buscando por ID exato — outros filtros desativados.{" "}
                <button onClick={() => setBuscaId("")} className="underline hover:no-underline font-medium">
                  Limpar ID
                </button>
              </p>
            )}

            {filtrosAtivos > 0 && (
              <div className="pt-0.5">
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
                {modoIdExato
                  ? "Nenhum cliente encontrado com este ID."
                  : "Nenhum cliente encontrado para os filtros selecionados."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["ID do Cliente", "Nome", "E-mail", "Telefone", "Gênero", "Cidade", "Estado"].map((col) => (
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
                          <td className="px-6 py-4 text-gray-600">{c.email_cliente}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{c.telefone_cliente}</td>
                          <td className="px-6 py-4">
                            <GenderBadge g={c.genero_cliente} />
                          </td>
                          <td className="px-6 py-4 text-gray-600">{c.cidade_cliente}</td>
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

                {/* paginação — oculta no modo ID exato */}
                {!modoIdExato && (
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
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                      >
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>

                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <span key={`e-${idx}`} className="px-2 text-gray-400 font-bold text-caption">...</span>
                        ) : (
                          <button
                            key={`p-${page}`}
                            onClick={() => setPagina(page as number)}
                            className={`h-8 w-8 rounded-lg text-caption font-semibold transition-all duration-150 cursor-pointer ${pagina === page
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-500 hover:bg-gray-100"
                              }`}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                        disabled={pagina === totalPaginas}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
                      >
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Clientes
