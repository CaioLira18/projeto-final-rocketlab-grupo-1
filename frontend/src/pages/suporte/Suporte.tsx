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
import { usePermission } from "@/hooks"
import { ToastContainer, useToast } from "@/components/ui/UseToast"

const API_BASE = "http://localhost:8000"
const PER_PAGE = 20

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

const TIPOS_PROBLEMA = ["Entrega", "Produto", "Pagamento", "Cancelamento", "Troca", "Outros"]
const STATUS_OPCOES = ["aberto", "resolvido"]

// ── helpers ────────────────────────────────────────────────────────────────
const formatNumber = (v: number) => new Intl.NumberFormat("pt-BR").format(v)

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
    <div className="min-h-75 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 text-secondary animate-spin" />
      <p className="text-body-2 text-gray-500">Carregando tickets de suporte...</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-75 flex flex-col items-center justify-center p-6 bg-error-50 rounded-xl border border-error-100 max-w-2xl mx-auto text-center space-y-4">
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

function KPICard({ title, value, icon: Icon, iconBg, iconColor }: { title: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string }) {
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
  const isResolvido = status === "resolvido"
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isResolvido ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
      {isResolvido ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {isResolvido ? "Resolvido" : "Aberto"}
    </span>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150
        ${active ? "bg-primary-50 border-primary-200 text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
    >
      {label}
      {active && <X className="h-3 w-3 ml-0.5 opacity-60" />}
    </button>
  )
}

function SelectFiltro({ opcoes, valor, onChange, placeholder }: { opcoes: string[]; valor: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between gap-2 min-w-40 px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100
          ${open ? "border-primary bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"}
          ${valor ? "text-primary font-medium" : "text-gray-500"}`}
      >
        <span className="truncate">{valor || placeholder}</span>
        <div className="flex items-center gap-1 shrink-0">
          {valor && (
            <X 
              className="h-3.5 w-3.5 text-gray-300 hover:text-error cursor-pointer transition-colors" 
              onClick={(e) => { e.stopPropagation(); onChange("") }} 
            />
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
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${o === valor ? "bg-primary-50/60 text-primary font-medium" : "hover:bg-gray-50 text-gray-700"}`}
                >
                  {o}
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
  const { can } = usePermission()
  const podeExportar = can("export.run")
  const toast = useToast()

  const [tickets, setTickets] = useState<SuporteTicket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)

  // Filtros estruturados em objeto único
  const [status, setStatus] = useState("")
  const [tipoProblema, setTipoProblema] = useState("")
  const [inputs, setInputs] = useState({ busca: "", ticketId: "", agente: "" })
  const [debounced, setDebounced] = useState({ busca: "", ticketId: "", agente: "" })
  
  const [kpis, setKpis] = useState({ abertos: 0, resolvidos: 0, tempoMedio: null as number | null })

  const modoIdExato = debounced.ticketId.trim().length > 0

  // Centraliza o debounce dos inputs de texto
  useEffect(() => {
    const t = setTimeout(() => setDebounced(inputs), 400)
    return () => clearTimeout(t)
  }, [inputs])

  // Reseta página ao alterar qualquer filtro
  useEffect(() => {
    setPagina(1)
  }, [debounced, status, tipoProblema])

  // Busca de KPIs Globais baseados nos filtros ativos
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const params = new URLSearchParams()
        if (debounced.busca) params.set("id_cliente", debounced.busca)
        if (debounced.agente) params.set("agente_suporte", debounced.agente)
        if (status) params.set("status", status)
        if (tipoProblema) params.set("tipo_problema", tipoProblema)

        const res = await fetch(`${API_BASE}/suporte/resumo?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        console.log(data)
        setKpis({
          abertos: data.abertos ?? 0,
          resolvidos: data.resolvidos ?? 0,
          tempoMedio: data.tempo_medio ?? null,
        })
      } catch { /* silencioso */ }
    }
    fetchKPIs()
  }, [debounced.busca, debounced.agente, status, tipoProblema])

  // Chamada principal unificada para listagem e busca por ID exato
  const loadData = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado. Faça login novamente.")
      const headers = { Authorization: `Bearer ${token}` }

      if (modoIdExato) {
        const res = await fetch(`${API_BASE}/suporte/tickets/${encodeURIComponent(debounced.ticketId.trim())}`, { headers })
        if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
        if (res.status === 404) { setTickets([]); setTotal(0); return }
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
        
        const data = await res.json()
        setTickets([data])
        setTotal(1)
      } else {
        const params = new URLSearchParams({
          skip: String((pagina - 1) * PER_PAGE),
          limit: String(PER_PAGE),
        })
        if (debounced.busca) params.set("id_cliente", debounced.busca)
        if (debounced.agente) params.set("agente_suporte", debounced.agente)
        if (status) params.set("status", status)
        if (tipoProblema) params.set("tipo_problema", tipoProblema)

        const res = await fetch(`${API_BASE}/suporte/tickets?${params.toString()}`, { headers })
        if (res.status === 401) throw new Error("Sessão expirada. Faça login novamente.")
        if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)

        const data = await res.json()
        console.log(data)
        const lista = Array.isArray(data) ? data : data.tickets ?? data.items ?? []
        const totalHeader = res.headers.get("X-Total-Count")
        
        setTickets(lista)
        setTotal(totalHeader ? parseInt(totalHeader, 10) : lista.length)
      }
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar dados")
      setTickets([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [debounced, pagina, status, tipoProblema, modoIdExato])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInputChange = (field: keyof typeof inputs, val: string) => {
    setInputs(prev => ({ ...prev, [field]: val }))
  }

  const limparFiltros = () => {
    setInputs({ busca: "", ticketId: "", agente: "" })
    setStatus("")
    setTipoProblema("")
  }

  const exportCSV = async () => {
    const id = toast.loading("Preparando exportação...")
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/export/suporte`, { headers: { Authorization: `Bearer ${token}` } })
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
      toast.update(id, "success", "CSV exportado com sucesso!")
    } catch (e: any) {
      toast.update(id, "error", e.message ?? "Erro ao exportar CSV")
    }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const filtrosAtivos = Object.values(inputs).filter(Boolean).length + (status ? 1 : 0) + (tipoProblema ? 1 : 0)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, pagina - 1)
      let end = Math.min(totalPaginas - 1, pagina + 1)
      if (pagina <= 3) end = 4
      else if (pagina >= totalPaginas - 2) start = totalPaginas - 3
      if (start > 2) pages.push("...")
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPaginas - 1) pages.push("...")
      pages.push(totalPaginas)
    }
    return pages
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-primary">Suporte</h1>
        <p className="text-body-2 text-gray-500 mt-1">Visão geral dos atendimentos e resoluções de tickets.</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : erro ? (
        <ErrorState error={erro} onRetry={loadData} />
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total de Tickets" value={formatNumber(kpis.abertos + kpis.resolvidos)} icon={Headphones} iconBg="bg-primary-50" iconColor="text-primary" />
            <KPICard title="Tickets Abertos" value={formatNumber(kpis.abertos)} icon={Clock} iconBg="bg-warning-50" iconColor="text-warning" />
            <KPICard title="Tickets Resolvidos" value={formatNumber(kpis.resolvidos)} icon={CheckCircle} iconBg="bg-success-50" iconColor="text-success" />
            <KPICard title="Tempo Médio" value={kpis.tempoMedio !== null ? `${kpis.tempoMedio}h` : "-"} icon={Clock} iconBg="bg-secondary-50" iconColor="text-secondary" />
          </div>

          {/* ── Barra de filtros ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute inset-y-0 left-0 flex items-center pl-3.5 pt-3 pointer-events-none text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por ID do cliente..."
                  value={inputs.busca}
                  onChange={(e) => handleInputChange("busca", e.target.value)}
                  disabled={modoIdExato}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 text-body-2 disabled:opacity-40"
                />
              </div>
              {podeExportar && (
                <Button variant="outlined" intent="action" leftIcon={<Download />} onClick={exportCSV}>
                  Exportar CSV
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute inset-y-0 left-0 flex items-center pl-3.5 pt-3 pointer-events-none text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID exato do ticket..."
                  value={inputs.ticketId}
                  onChange={(e) => handleInputChange("ticketId", e.target.value)}
                  className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-body-2 ${modoIdExato ? "border-primary bg-primary-50/20 font-medium text-primary" : "border-gray-200"}`}
                />
                {inputs.ticketId && (
                  <button onClick={() => handleInputChange("ticketId", "")} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-gray-500">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14">Status:</span>
                {STATUS_OPCOES.map((s) => (
                  <FilterChip key={s} label={s === "aberto" ? "Aberto" : "Resolvido"} active={status === s} onClick={() => setStatus(prev => prev === s ? "" : s)} />
                ))}
              </div>

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400">Tipo:</span>
                <SelectFiltro opcoes={TIPOS_PROBLEMA} valor={tipoProblema} onChange={setTipoProblema} placeholder="Todos os tipos" />
              </div>

              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1" />

              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400">Agente:</span>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={inputs.agente}
                    onChange={(e) => handleInputChange("agente", e.target.value)}
                    className={`pl-3 pr-7 py-2 rounded-lg border text-sm w-40 ${inputs.agente ? "border-primary-200 bg-primary-50/20 text-primary font-medium" : "border-gray-200"}`}
                  />
                  {inputs.agente && (
                    <button onClick={() => handleInputChange("agente", "")} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300 hover:text-gray-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {modoIdExato && (
              <p className="text-xs text-primary bg-primary-50/50 border border-primary-100 rounded-lg px-3 py-1.5">
                Buscando por ID exato do ticket - outros filtros desativados.{" "}
                <button onClick={() => handleInputChange("ticketId", "")} className="underline font-medium">Limpar ID</button>
              </p>
            )}

            {filtrosAtivos > 0 && (
              <button onClick={limparFiltros} className="text-caption text-gray-400 hover:text-error underline underline-offset-2">
                Limpar todos os filtros ({filtrosAtivos})
              </button>
            )}
          </div>

          {/* ── Tabela ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tickets.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                {modoIdExato ? "Nenhum ticket encontrado com este ID." : "Nenhum ticket encontrado para os filtros selecionados."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["ID do Ticket", "Id do Cliente", "Nome Cliente", "Produto", "Categoria", "Tipo de Problema", "Status", "Agente", "Abertura", "Resolução", "Tempo (h)"].map((col) => (
                          <th key={col} className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tickets.map((t) => (
                        <tr key={t.ticket_id} className="hover:bg-gray-50/50 text-body-2 text-gray-700 cursor-pointer">
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{t.ticket_id}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{t.id_cliente}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 whitespace-nowrap">{t.nome_cliente}</td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.nome_produto ?? <span className="text-gray-300">-</span>}</td>
                          <td className="px-6 py-4">
                            {t.categoria_produto ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">{t.categoria_produto}</span> : <span className="text-gray-300">-</span>}
                          </td>
                          <td className="px-6 py-4">
                            {t.tipo_problema ? <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-700">{t.tipo_problema}</span> : <span className="text-gray-300">-</span>}
                          </td>
                          <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                          <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{t.agente_suporte ?? <span className="text-gray-300">-</span>}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDatetime(t.data_abertura) ?? <span className="text-gray-300">-</span>}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{formatDatetime(t.data_resolucao) ?? <span className="text-gray-300">-</span>}</td>
                          <td className="px-6 py-4 text-gray-600 text-center">{t.tempo_resolucao_horas ?? <span className="text-gray-300">-</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!modoIdExato && (
                  <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                    <div className="text-caption text-gray-500 font-medium">
                      Mostrando <span className="font-semibold text-gray-700">{total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1}</span> a{" "}
                      <span className="font-semibold text-gray-700">{Math.min(pagina * PER_PAGE, total)}</span> de{" "}
                      <span className="font-semibold text-gray-700">{formatNumber(total)}</span> tickets
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>
                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <span key={`e-${idx}`} className="px-2 text-gray-400 font-bold text-caption flex items-center justify-center">...</span>
                        ) : (
                          <button key={`p-${page}`} onClick={() => setPagina(page as number)} className={`h-8 w-8 flex items-center justify-center rounded-lg text-caption font-semibold transition-all duration-150 cursor-pointer ${pagina === page ? "bg-primary text-white border border-primary shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
                            {page}
                          </button>
                        )
                      )}
                      <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40">
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

      <ToastContainer toasts={toast.toasts} onClose={toast.remove} />
    </div>
  )
}

export default Suporte
