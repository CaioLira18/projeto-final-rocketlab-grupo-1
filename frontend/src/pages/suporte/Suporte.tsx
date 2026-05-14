import { useState, useEffect, useCallback } from "react"
import {
  Headphones,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  ChevronDown,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui"

const API_BASE = "http://localhost:8000"
const PER_PAGE = 20

// ── tipos ──────────────────────────────────────────────────────────────────
interface SuporteTicket {
  ticket_id: string
  id_cliente: string | null
  nome_cliente: string | null
  id_pedido: string | null
  id_produto: string | null
  nome_produto: string | null
  categoria_produto: string | null
  data_pedido: string | null
  tipo_problema: string | null
  data_abertura: string | null
  data_resolucao: string | null
  tempo_resolucao_horas: number | null
  agente_suporte: string | null
  status: "aberto" | "resolvido"
}

// ── constantes ─────────────────────────────────────────────────────────────
const TIPOS_PROBLEMA = [
  "Entrega",
  "Produto",
  "Pagamento",
  "Cancelamento",
  "Troca",
  "Outros",
]

const STATUS_OPCOES = ["aberto", "resolvido"]

// ── helpers ────────────────────────────────────────────────────────────────
const formatNumber = (v: number) => new Intl.NumberFormat("pt-BR").format(v)

const formatDate = (d: string | null) => {
  if (!d) return null
  try {
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return d
  }
}

const formatDatetime = (d: string | null) => {
  if (!d) return null
  try {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return d
  }
}

// ── subcomponentes ─────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 text-secondary animate-spin" />
      <p className="text-body-2 text-gray-500">Carregando tickets de suporte...</p>
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

interface KPICardProps {
  title: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

function KPICard({ title, value, icon: Icon, iconBg, iconColor }: KPICardProps) {
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

function StatusBadge({ status }: { status: "aberto" | "resolvido" }) {
  if (status === "resolvido") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-700">
        <CheckCircle className="h-3 w-3" />
        Resolvido
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-50 text-warning-700">
      <Clock className="h-3 w-3" />
      Aberto
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

interface SelectFiltroProps {
  opcoes: string[]
  valor: string
  onChange: (v: string) => void
  placeholder: string
  labelMap?: Record<string, string>
}

function SelectFiltro({ opcoes, valor, onChange, placeholder, labelMap }: SelectFiltroProps) {
  const [open, setOpen] = useState(false)
  const label = valor ? (labelMap?.[valor] ?? valor) : placeholder
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 min-w-[160px] px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100
          ${open ? "border-primary bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"}
          ${valor ? "text-primary font-medium" : "text-gray-500"}`}
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {valor && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange("") }}
              onKeyDown={(e) => e.key === "Enter" && onChange("")}
              className="text-gray-300 hover:text-error transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {opcoes.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => { onChange(o === valor ? "" : o); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${o === valor ? "bg-primary-50/60 text-primary font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                >
                  {labelMap?.[o] ?? o}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── componente principal ───────────────────────────────────────────────────
export function Suporte() {
  const [tickets, setTickets] = useState<SuporteTicket[]>([])
  const [total, setTotal] = useState(0)
  const [totalAbertos, setTotalAbertos] = useState(0)
  const [totalResolvidos, setTotalResolvidos] = useState(0)
  const [tempoMedio, setTempoMedio] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // filtros de texto com debounce
  const [busca, setBusca] = useState("")
  const [buscaDebounced, setBuscaDebounced] = useState("")
  const [buscaTicketId, setBuscaTicketId] = useState("")
  const [buscaTicketIdDebounced, setBuscaTicketIdDebounced] = useState("")
  const [agente, setAgente] = useState("")
  const [agenteDebounced, setAgenteDebounced] = useState("")

  // filtros de select/chips
  const [status, setStatus] = useState("")
  const [tipoProblema, setTipoProblema] = useState("")

  const [pagina, setPagina] = useState(1)

  const modoIdExato = buscaTicketIdDebounced.trim().length > 0

  // ── debounces ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    const t = setTimeout(() => setBuscaTicketIdDebounced(buscaTicketId), 500)
    return () => clearTimeout(t)
  }, [buscaTicketId])

  useEffect(() => {
    const t = setTimeout(() => setAgenteDebounced(agente), 400)
    return () => clearTimeout(t)
  }, [agente])

  // ── helper: monta params ───────────────────────────────────────────────
  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    if (buscaDebounced) params.set("id_cliente", buscaDebounced)
    if (agenteDebounced) params.set("agente_suporte", agenteDebounced)
    if (status) params.set("status", status)
    if (tipoProblema) params.set("tipo_problema", tipoProblema)
    Object.entries(extra).forEach(([k, v]) => params.set(k, v))
    return params
  }, [buscaDebounced, agenteDebounced, status, tipoProblema])

  // ── fetch KPIs globais (endpoint de resumo agregado) ─────────────────
  // Substituir o fetchKPIs e seu useEffect
  const fetchKPIs = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const params = buildParams() // ← usa os filtros ativos
      const res = await fetch(`${API_BASE}/suporte/resumo?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setTotalAbertos(data.abertos ?? 0)
      setTotalResolvidos(data.resolvidos ?? 0)
      setTempoMedio(data.tempo_medio ?? null)
    } catch {
      // silencioso
    }
  }, [buildParams]) // ← depende de buildParams agora


  // O useEffect já vai reagir automaticamente porque buildParams
  // muda quando qualquer filtro muda
  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])

  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])


  // ── fetch por ticket ID exato ──────────────────────────────────────────
  const fetchPorId = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const res = await fetch(
        `${API_BASE}/suporte/tickets/${encodeURIComponent(buscaTicketIdDebounced.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
      if (res.status === 404) { setTickets([]); setTotal(0); return }
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const data: SuporteTicket = await res.json()
      setTickets([data])
      setTotal(1)
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar ticket")
      setTickets([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buscaTicketIdDebounced])

  // ── fetch lista com filtros ────────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")

      const params = buildParams({
        skip: String((pagina - 1) * PER_PAGE),
        limit: String(PER_PAGE),
      })

      const res = await fetch(`${API_BASE}/suporte/tickets?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

      const data = await res.json()
      console.log(data)
      const lista: SuporteTicket[] = Array.isArray(data) ? data : data.tickets ?? data.items ?? []

      // lê o total do header X-Total-Count (adicionado pelo backend)
      const totalHeader = res.headers.get("X-Total-Count")
      setTotal(totalHeader !== null ? parseInt(totalHeader, 10) : lista.length)

      setTickets(lista)
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar tickets")
      setTickets([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buildParams, pagina])

  // fetch principal
  useEffect(() => {
    if (modoIdExato) fetchPorId()
    else fetchTickets()
  }, [modoIdExato, fetchPorId, fetchTickets])

  // reseta página ao mudar filtros
  useEffect(() => {
    setPagina(1)
  }, [buscaDebounced, buscaTicketIdDebounced, agenteDebounced, status, tipoProblema])

  const limparFiltros = () => {
    setBusca("")
    setBuscaTicketId("")
    setAgente("")
    setStatus("")
    setTipoProblema("")
    setPagina(1)
  }

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/export/suporte`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Erro ao exportar CSV")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `suporte_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message ?? "Erro ao exportar CSV")
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const primeiroItem = total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1
  const ultimoItem = Math.min(pagina * PER_PAGE, total)

  const filtrosAtivos =
    (busca ? 1 : 0) +
    (agente ? 1 : 0) +
    (status ? 1 : 0) +
    (tipoProblema ? 1 : 0) +
    (buscaTicketId ? 1 : 0)

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
        <h1 className="text-h1 text-primary">Suporte</h1>
        <p className="text-body-2 text-gray-500 mt-1">
          Visão geral dos atendimentos e resoluções de tickets de clientes.
        </p>
      </div>

      {loading ? (
        <LoadingState />
      ) : erro ? (
        <ErrorState error={erro} onRetry={modoIdExato ? fetchPorId : fetchTickets} />
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total de Tickets"
              value={formatNumber(totalAbertos + totalResolvidos)}
              icon={Headphones}
              iconBg="bg-primary-50"
              iconColor="text-primary"
            />
            <KPICard
              title="Tickets Abertos"
              value={formatNumber(totalAbertos)}
              icon={Clock}
              iconBg="bg-warning-50"
              iconColor="text-warning"
            />
            <KPICard
              title="Tickets Resolvidos"
              value={formatNumber(totalResolvidos)}
              icon={CheckCircle}
              iconBg="bg-success-50"
              iconColor="text-success"
            />
            <KPICard
              title="Tempo Médio de Resolução"
              value={tempoMedio !== null ? `${tempoMedio}h` : "—"}
              icon={Clock}
              iconBg="bg-secondary-50"
              iconColor="text-secondary"
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
                  placeholder="Buscar por ID do cliente..."
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

            {/* Linha 2: busca por ticket ID exato */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por ID exato do ticket..."
                  value={buscaTicketId}
                  onChange={(e) => { setBuscaTicketId(e.target.value); setPagina(1) }}
                  className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200
                    ${modoIdExato ? "border-primary bg-primary-50/20 font-medium text-primary" : "border-gray-200"}`}
                />
                {buscaTicketId && (
                  <button
                    onClick={() => { setBuscaTicketId(""); setPagina(1) }}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Linha 3: status + tipo de problema + agente */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">

              {/* Status chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Status:</span>
                {STATUS_OPCOES.map((s) => (
                  <FilterChip
                    key={s}
                    label={s === "aberto" ? "Aberto" : "Resolvido"}
                    active={status === s}
                    onClick={() => {
                      setStatus((prev) => prev === s ? "" : s)
                      setPagina(1)
                    }}
                  />
                ))}
              </div>

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />

              {/* Tipo de problema */}
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Tipo:</span>
                <SelectFiltro
                  opcoes={TIPOS_PROBLEMA}
                  valor={tipoProblema}
                  onChange={(v) => { setTipoProblema(v); setPagina(1) }}
                  placeholder="Todos os tipos"
                />
              </div>

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />

              {/* Agente de suporte */}
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Agente:</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={agente}
                    onChange={(e) => { setAgente(e.target.value); setPagina(1) }}
                    className={`pl-3 pr-7 py-2 rounded-lg border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 w-40
                      ${agente ? "border-primary-200 bg-primary-50/20 text-primary font-medium" : "border-gray-200 bg-white"}`}
                  />
                  {agente && (
                    <button
                      onClick={() => { setAgente(""); setPagina(1) }}
                      className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300 hover:text-gray-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* aviso modo ID exato */}
            {modoIdExato && (
              <p className="text-xs text-primary bg-primary-50/50 border border-primary-100 rounded-lg px-3 py-1.5">
                Buscando por ID exato do ticket — outros filtros desativados.{" "}
                <button onClick={() => setBuscaTicketId("")} className="underline hover:no-underline font-medium">
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
            {tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                {modoIdExato
                  ? "Nenhum ticket encontrado com este ID."
                  : "Nenhum ticket encontrado para os filtros selecionados."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {[
                          "ID do Ticket",
                          "Id do Cliente",
                          "Produto",
                          "Categoria",
                          "Tipo de Problema",
                          "Status",
                          "Agente",
                          "Abertura",
                          "Resolução",
                          "Tempo (h)",
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
                      {tickets.map((t) => (
                        <tr
                          key={t.ticket_id}
                          className="hover:bg-gray-50/50 transition-colors duration-150 text-body-2 text-gray-700 cursor-pointer"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 tracking-tight whitespace-nowrap">
                            {t.ticket_id}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 tracking-tight whitespace-nowrap">
                            {t.ticket_id}
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {t.nome_produto ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4">
                            {t.categoria_produto ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                                {t.categoria_produto}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {t.tipo_problema ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-700">
                                {t.tipo_problema}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                            {t.agente_suporte ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {formatDatetime(t.data_abertura) ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                            {formatDatetime(t.data_resolucao) ?? <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {t.tempo_resolucao_horas !== null
                              ? t.tempo_resolucao_horas
                              : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* paginação */}
                {!modoIdExato && (
                  <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                    <div className="text-caption text-gray-500 font-medium order-2 sm:order-1">
                      Mostrando{" "}
                      <span className="font-semibold text-gray-700">{primeiroItem}</span> a{" "}
                      <span className="font-semibold text-gray-700">{ultimoItem}</span> de{" "}
                      <span className="font-semibold text-gray-700">{formatNumber(total)}</span> tickets
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

export default Suporte
