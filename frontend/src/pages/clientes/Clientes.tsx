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
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  ShoppingBag,
  Headphones,
  Star,
  TrendingUp,
  Activity,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart2,
  MousePointer,
  ShoppingCart,
  Eye,
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
  ramal_cliente?: string | number | null
  genero_cliente: string
  data_nascimento_cliente?: string | null
  data_cadastro_cliente?: string | null
  endereco_cliente?: string | null
  cidade_cliente: string
  estado_cliente: string
  pais_cliente: string
  origem_cliente: string
  idade: number
}

interface Cliente360 {
  id_cliente: string
  nome_cliente: string
  sobrenome_cliente: string
  nome_completo_cliente: string
  email_cliente: string
  telefone_cliente: string
  genero_cliente: string
  cidade_cliente: string
  estado_cliente: string
  pais_cliente: string
  origem_cliente: string
  data_cadastro_cliente: string
  idade_cliente: number
  // compras
  total_pedidos: number
  receita_total_cliente: number
  ticket_medio_cliente: number
  total_itens_comprados: number
  data_primeira_compra: string
  data_ultima_compra: string
  recencia_dias: number
  pedidos_entregues: number
  pedidos_cancelados: number
  pedidos_reembolsados: number
  // suporte
  total_tickets: number
  tickets_abertos: number
  tickets_fechados: number
  tempo_medio_resolucao_horas: number
  nota_media_atendimento: number
  data_ultimo_ticket: string
  // avaliações
  total_avaliacoes: number
  nota_media_produto: number
  nps_medio_cliente: number
  taxa_recomendacao_cliente: number
  data_ultima_avaliacao: string
  // engajamento
  total_sessoes: number
  total_eventos: number
  tempo_medio_pagina_seg: number
  data_ultimo_evento: string
  eventos_compra: number
  eventos_add_carrinho: number
  eventos_pageview: number
  // segmento
  faixa_valor_cliente: string
  cliente_ativo_90d: boolean
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
const ORIGENS_OPCOES = ["Web", "App", "Indicação"]

// ── helpers ────────────────────────────────────────────────────────────────
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR").format(value)
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
const formatDate = (d?: string | null) => {
  if (!d) return "—"
  try { return new Date(d).toLocaleDateString("pt-BR") } catch { return d }
}

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

function ClienteCardKPI({ title, value, icon: Icon, iconBg, iconColor }: {
  title: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string
}) {
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
  const color = g === "Feminino" ? "bg-pink-50 text-pink-600" : g === "Masculino" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
  const label = g === "Feminino" ? "F" : g === "Masculino" ? "M" : "?"
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${color}`}>{label}</span>
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${active ? "bg-primary-50 border-primary-200 text-primary" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
      {label}
      {active && <X className="h-3 w-3 ml-0.5 opacity-60" />}
    </button>
  )
}

interface MultiSelectProps {
  opcoes: string[]; selecionados: string[]; onChange: (novos: string[]) => void; placeholder: string; buscavel?: boolean
}
function MultiSelect({ opcoes, selecionados, onChange, placeholder, buscavel = false }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [filtro, setFiltro] = useState("")
  const toggle = (v: string) => onChange(selecionados.includes(v) ? selecionados.filter((x) => x !== v) : [...selecionados, v])
  const opcoesFiltradas = buscavel ? opcoes.filter((o) => o.toLowerCase().includes(filtro.toLowerCase())) : opcoes
  const label = selecionados.length === 0 ? placeholder : selecionados.length === 1 ? selecionados[0] : `${selecionados.length} selecionados`

  return (
    <div className="relative">
      <button type="button" onClick={() => { setOpen((v) => !v); setFiltro("") }}
        className={`flex items-center justify-between gap-2 w-full min-w-[190px] px-3 py-2 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-100 ${open ? "border-primary bg-primary-50/30" : "border-gray-200 bg-white hover:border-gray-300"} ${selecionados.length > 0 ? "text-primary font-medium" : "text-gray-500"}`}>
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selecionados.length > 0 && (
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onChange([]) }} onKeyDown={(e) => e.key === "Enter" && onChange([])} className="text-gray-300 hover:text-error transition-colors" title="Limpar">
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
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
                  <input autoFocus type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-100 focus:border-primary" />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
              {opcoesFiltradas.length === 0 ? <p className="px-4 py-3 text-sm text-gray-400">Nenhuma opção encontrada</p> : opcoesFiltradas.map((o) => {
                const checked = selecionados.includes(o)
                return (
                  <label key={o} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors text-sm ${checked ? "bg-primary-50/60 text-primary font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(o)} className="accent-primary h-3.5 w-3.5 rounded" />
                    {o}
                  </label>
                )
              })}
            </div>
            {selecionados.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
                <button type="button" onClick={() => { onChange([]); setOpen(false) }} className="text-xs text-error hover:underline">Limpar seleção ({selecionados.length})</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function RangeIdade({ min, max, onMinChange, onMaxChange }: { min: string; max: string; onMinChange: (v: string) => void; onMaxChange: (v: string) => void }) {
  const ativo = min !== "" || max !== ""
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm transition-all duration-200 ${ativo ? "border-primary-200 bg-primary-50/30" : "border-gray-200 bg-white"}`}>
      <input type="number" min={0} max={120} placeholder="De" value={min} onChange={(e) => onMinChange(e.target.value)} className="w-14 bg-transparent text-center focus:outline-none placeholder-gray-400 text-gray-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <span className="text-gray-300 text-xs font-medium">—</span>
      <input type="number" min={0} max={120} placeholder="Até" value={max} onChange={(e) => onMaxChange(e.target.value)} className="w-14 bg-transparent text-center focus:outline-none placeholder-gray-400 text-gray-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      {ativo && <button onClick={() => { onMinChange(""); onMaxChange("") }} className="text-gray-300 hover:text-error transition-colors ml-0.5" title="Limpar"><X className="h-3.5 w-3.5" /></button>}
    </div>
  )
}

// ── TELA 360 ───────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"}`} />
      ))}
      <span className="ml-1 text-xs font-semibold text-gray-700">{value?.toFixed(1)}</span>
    </div>
  )
}

function MetricCard({ label, value, sub, icon: Icon, color = "primary" }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color?: string
}) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary-50 text-primary",
    success: "bg-success-50 text-success",
    warning: "bg-amber-50 text-amber-600",
    error: "bg-error-50 text-error",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color] ?? colorMap.primary}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-caption text-gray-400 font-medium leading-tight">{label}</p>
        <p className="text-base font-bold text-gray-900 mt-0.5 leading-snug">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, iconColor }: { icon: React.ElementType; title: string; iconColor: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h3>
    </div>
  )
}

function Cliente360View({ clienteId, onVoltar }: { clienteId: string; onVoltar: () => void }) {
  const [data, setData] = useState<Cliente360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const fetch360 = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/clientes/360/${encodeURIComponent(clienteId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 404) throw new Error("Dados 360 não encontrados para este cliente.")
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
      const json: Cliente360 = await res.json()
      setData(json)
    } catch (e: any) {
      setErro(e.message ?? "Erro ao carregar visão 360")
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => { fetch360() }, [fetch360])

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-body-2 text-gray-500">Carregando visão 360...</p>
      </div>
    )
  }

  if (erro || !data) {
    return (
      <div className="space-y-4">
        <button onClick={onVoltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para a lista
        </button>
        <div className="min-h-[300px] flex flex-col items-center justify-center p-6 bg-error-50 rounded-xl border border-error-100 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-error" />
          <div>
            <h3 className="text-h3 text-error-500 font-bold">Falha ao carregar</h3>
            <p className="text-body-2 text-gray-600 mt-1">{erro}</p>
          </div>
          <Button onClick={fetch360} className="bg-error hover:bg-error-400 text-white">Tentar novamente</Button>
        </div>
      </div>
    )
  }

  const iniciais = `${data.nome_cliente?.[0] ?? ""}${data.sobrenome_cliente?.[0] ?? ""}`.toUpperCase()
  const faixaColor: Record<string, string> = {
    "Alta": "bg-success-50 text-success border-success-100",
    "Média": "bg-amber-50 text-amber-600 border-amber-100",
    "Baixa": "bg-gray-100 text-gray-500 border-gray-200",
  }

  return (
    <div className="space-y-6">
      {/* ── breadcrumb / voltar ── */}
      <div className="flex items-center gap-3">
        <button onClick={onVoltar} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" />
          Clientes
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-semibold">{data.nome_completo_cliente}</span>
        <span className="text-sm text-gray-400 font-mono">#{data.id_cliente.slice(0, 8)}</span>
      </div>

      {/* ── cabeçalho do cliente ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* avatar */}
          <div className="w-16 h-16 rounded-2xl bg-primary-50 border-2 border-primary-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary">{iniciais}</span>
          </div>

          {/* info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-h2 font-bold text-gray-900">{data.nome_completo_cliente}</h2>
              {data.cliente_ativo_90d ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success-50 text-success border border-success-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" /> Ativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" /> Inativo
                </span>
              )}
              {data.faixa_valor_cliente && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${faixaColor[data.faixa_valor_cliente] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                  {data.faixa_valor_cliente} valor
                </span>
              )}
            </div>
            <p className="text-caption text-gray-400 font-mono mb-3">{data.id_cliente}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{data.email_cliente}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{data.telefone_cliente}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{data.cidade_cliente}, {data.estado_cliente}</span>
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" />{data.idade_cliente} anos · {data.genero_cliente}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gray-400" />Cadastro: {formatDate(data.data_cadastro_cliente)}</span>
              <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-gray-400" />Origem: {data.origem_cliente}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPIs principais ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Receita Total" value={formatCurrency(data.receita_total_cliente)} icon={TrendingUp} color="success" />
        <MetricCard label="Total de Pedidos" value={formatNumber(data.total_pedidos)} sub={`Ticket médio: ${formatCurrency(data.ticket_medio_cliente)}`} icon={ShoppingBag} color="primary" />
        <MetricCard label="Recência" value={`${data.recencia_dias} dias`} sub={`Última compra: ${formatDate(data.data_ultima_compra)}`} icon={Clock} color={data.recencia_dias <= 30 ? "success" : data.recencia_dias <= 90 ? "warning" : "error"} />
        <MetricCard label="NPS Médio" value={data.nps_medio_cliente?.toFixed(1) ?? "—"} sub={`${data.taxa_recomendacao_cliente?.toFixed(0)}% recomenda`} icon={Star} color="purple" />
      </div>

      {/* ── grade de seções ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Compras ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={ShoppingBag} title="Compras" iconColor="text-primary" />
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total de itens</span><span className="font-semibold text-gray-800">{formatNumber(data.total_itens_comprados)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Primeira compra</span><span className="font-semibold text-gray-800">{formatDate(data.data_primeira_compra)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Última compra</span><span className="font-semibold text-gray-800">{formatDate(data.data_ultima_compra)}</span></div>
            <div className="border-t border-gray-50 pt-2.5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500"><CheckCircle className="h-3.5 w-3.5 text-success" />Entregues</span>
                <span className="font-semibold text-gray-800">{data.pedidos_entregues}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500"><XCircle className="h-3.5 w-3.5 text-error" />Cancelados</span>
                <span className="font-semibold text-gray-800">{data.pedidos_cancelados}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-gray-500"><RefreshCw className="h-3.5 w-3.5 text-amber-500" />Reembolsados</span>
                <span className="font-semibold text-gray-800">{data.pedidos_reembolsados}</span>
              </div>
            </div>
            {/* barra de status */}
            {data.total_pedidos > 0 && (
              <div className="pt-1">
                <div className="flex h-2 rounded-full overflow-hidden gap-px bg-gray-100">
                  <div className="bg-success h-full rounded-l" style={{ width: `${(data.pedidos_entregues / data.total_pedidos) * 100}%` }} />
                  <div className="bg-amber-400 h-full" style={{ width: `${(data.pedidos_reembolsados / data.total_pedidos) * 100}%` }} />
                  <div className="bg-error h-full rounded-r" style={{ width: `${(data.pedidos_cancelados / data.total_pedidos) * 100}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{((data.pedidos_entregues / data.total_pedidos) * 100).toFixed(0)}% entregues</span>
                  <span>{data.total_pedidos} total</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Suporte ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={Headphones} title="Suporte" iconColor="text-purple-500" />
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total de tickets</span><span className="font-semibold text-gray-800">{data.total_tickets}</span></div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-success inline-block" />Fechados</span>
              <span className="font-semibold text-gray-800">{data.tickets_fechados}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Abertos</span>
              <span className={`font-semibold ${data.tickets_abertos > 0 ? "text-amber-600" : "text-gray-800"}`}>{data.tickets_abertos}</span>
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Tempo médio resolução</span><span className="font-semibold text-gray-800">{data.tempo_medio_resolucao_horas?.toFixed(1) ?? "—"}h</span></div>
            <div className="border-t border-gray-50 pt-2.5">
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Nota média atendimento</span>
                <StarRating value={data.nota_media_atendimento ?? 0} />
              </div>
            </div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Último ticket</span><span className="font-semibold text-gray-800">{formatDate(data.data_ultimo_ticket)}</span></div>
          </div>
        </div>

        {/* ── Avaliações ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <SectionTitle icon={Star} title="Avaliações" iconColor="text-amber-500" />
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Total de avaliações</span><span className="font-semibold text-gray-800">{data.total_avaliacoes}</span></div>
            <div className="flex justify-between text-sm items-center"><span className="text-gray-500">Nota média produto</span><StarRating value={data.nota_media_produto ?? 0} /></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">Última avaliação</span><span className="font-semibold text-gray-800">{formatDate(data.data_ultima_avaliacao)}</span></div>

            <div className="border-t border-gray-50 pt-2.5 space-y-2.5">
              {/* NPS gauge simples */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-500">NPS médio</span>
                  <span className="font-bold text-gray-800">{data.nps_medio_cliente?.toFixed(1)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${data.nps_medio_cliente >= 8 ? "bg-success" : data.nps_medio_cliente >= 6 ? "bg-amber-400" : "bg-error"}`}
                    style={{ width: `${Math.max(0, Math.min(100, (data.nps_medio_cliente / 10) * 100))}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa de recomendação</span>
                <span className={`font-semibold ${data.taxa_recomendacao_cliente >= 70 ? "text-success" : data.taxa_recomendacao_cliente >= 40 ? "text-amber-600" : "text-error"}`}>
                  {data.taxa_recomendacao_cliente?.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Engajamento Digital ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <SectionTitle icon={BarChart2} title="Engajamento Digital" iconColor="text-blue-500" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <MetricCard label="Sessões" value={formatNumber(data.total_sessoes)} icon={Activity} color="blue" />
          <MetricCard label="Eventos totais" value={formatNumber(data.total_eventos)} icon={MousePointer} color="primary" />
          <MetricCard label="Compras" value={formatNumber(data.eventos_compra)} icon={ShoppingBag} color="success" />
          <MetricCard label="Add carrinho" value={formatNumber(data.eventos_add_carrinho)} icon={ShoppingCart} color="warning" />
          <MetricCard label="Pageviews" value={formatNumber(data.eventos_pageview)} icon={Eye} color="purple" />
          <MetricCard label="Tempo médio/pág." value={`${data.tempo_medio_pagina_seg?.toFixed(0)}s`} sub={`Último evento: ${formatDate(data.data_ultimo_evento)}`} icon={Clock} color="blue" />
        </div>
      </div>
    </div>
  )
}

// ── componente principal ───────────────────────────────────────────────────
export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // ── visão 360 ──────────────────────────────────────────────────────────
  const [clienteId360, setClienteId360] = useState<string | null>(null)

  // filtros
  const [ramal, setRamal] = useState("")
  const [ramalDebounced, setRamalDebounced] = useState("")
  const [semRamal, setSemRamal] = useState(false)
  const [busca, setBusca] = useState("")
  const [buscaDebounced, setBuscaDebounced] = useState("")
  const [buscaId, setBuscaId] = useState("")
  const [buscaIdDebounced, setBuscaIdDebounced] = useState("")
  const [cidades, setCidades] = useState<string[]>([])
  const [estados, setEstados] = useState<string[]>([])
  const [generos, setGeneros] = useState<string[]>([])
  const [origens, setOrigens] = useState<string[]>([])
  const [pais, setPais] = useState("")
  const [paisDebounced, setPaisDebounced] = useState("")
  const [ano_cadastro, setAnoCadastro] = useState("")
  const [anoCadastroDebounced, setAnoCadastroDebounced] = useState("")
  const [idadeMin, setIdadeMin] = useState("")
  const [idadeMax, setIdadeMax] = useState("")
  const [idadeMinDebounced, setIdadeMinDebounced] = useState("")
  const [idadeMaxDebounced, setIdadeMaxDebounced] = useState("")
  const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([])
  const [pagina, setPagina] = useState(1)

  const modoIdExato = buscaIdDebounced.trim().length > 0

  // debounces
  useEffect(() => { const t = setTimeout(() => setBuscaDebounced(busca), 400); return () => clearTimeout(t) }, [busca])
  useEffect(() => { const t = setTimeout(() => setRamalDebounced(ramal), 400); return () => clearTimeout(t) }, [ramal])
  useEffect(() => { const t = setTimeout(() => setBuscaIdDebounced(buscaId), 500); return () => clearTimeout(t) }, [buscaId])
  useEffect(() => { const t = setTimeout(() => setPaisDebounced(pais), 400); return () => clearTimeout(t) }, [pais])
  useEffect(() => { const t = setTimeout(() => setIdadeMinDebounced(idadeMin), 400); return () => clearTimeout(t) }, [idadeMin])
  useEffect(() => { const t = setTimeout(() => setIdadeMaxDebounced(idadeMax), 400); return () => clearTimeout(t) }, [idadeMax])
  useEffect(() => { const t = setTimeout(() => setAnoCadastroDebounced(ano_cadastro), 500); return () => clearTimeout(t) }, [ano_cadastro])

  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams()
    if (buscaDebounced) params.set("busca", buscaDebounced)
    cidades.forEach((c) => params.append("cidade", c))
    estados.forEach((e) => params.append("estado", e))
    generos.forEach((g) => params.append("genero", g))
    origens.forEach((o) => params.append("origem", o))
    if (paisDebounced) params.set("pais", paisDebounced)
    if (idadeMinDebounced !== "") params.set("idade_min", idadeMinDebounced)
    if (idadeMaxDebounced !== "") params.set("idade_max", idadeMaxDebounced)
    if (anoCadastroDebounced) params.append("ano_cadastro", anoCadastroDebounced)
    if (semRamal) { params.set("sem_ramal", "true") } else if (ramalDebounced) { params.set("ramal", ramalDebounced) }
    Object.entries(extra).forEach(([k, v]) => params.set(k, v))
    return params
  }, [buscaDebounced, cidades, estados, generos, origens, paisDebounced, idadeMinDebounced, idadeMaxDebounced, ramalDebounced, semRamal, anoCadastroDebounced])

  const fetchPorId = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/clientes/${encodeURIComponent(buscaIdDebounced.trim())}`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401) throw new Error("Sessão expirada.")
      if (res.status === 404) { setClientes([]); setTotal(0); return }
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
      const data: Cliente = await res.json()
      setClientes([data]); setTotal(1)
    } catch (e: any) { setErro(e.message ?? "Erro"); setClientes([]); setTotal(0) }
    finally { setLoading(false) }
  }, [buscaIdDebounced])

  const fetchClientes = useCallback(async () => {
    setLoading(true); setErro(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const params = buildParams({ skip: String((pagina - 1) * PER_PAGE), limit: String(PER_PAGE) })
      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
      if (res.status === 401) throw new Error("Sessão expirada.")
      if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`)
      const data = await res.json()
      const lista: Cliente[] = Array.isArray(data) ? data : data.clientes ?? data.items ?? []
      const tot: number = Array.isArray(data) ? data.length : data.total ?? data.count ?? lista.length
      setClientes(lista); setTotal(tot)
    } catch (e: any) { setErro(e.message ?? "Erro"); setClientes([]); setTotal(0) }
    finally { setLoading(false) }
  }, [buildParams, pagina])

  const fetchCidadesDisponiveis = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const params = buildParams({ limit: "500" })
      const res = await fetch(`${API_BASE}/clientes/?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      const lista: Cliente[] = Array.isArray(data) ? data : data.clientes ?? data.items ?? []
      const unique = [...new Set(lista.map((c) => c.cidade_cliente).filter(Boolean))].sort() as string[]
      setCidadesDisponiveis(unique)
    } catch { /* silencioso */ }
  }, [buildParams])

  useEffect(() => { if (!modoIdExato) fetchCidadesDisponiveis() }, [modoIdExato, fetchCidadesDisponiveis])
  useEffect(() => { if (modoIdExato) fetchPorId(); else fetchClientes() }, [modoIdExato, fetchPorId, fetchClientes])
  useEffect(() => { setPagina(1) }, [buscaDebounced, buscaIdDebounced, cidades, estados, generos, origens, paisDebounced, idadeMinDebounced, idadeMaxDebounced, ramalDebounced, semRamal, anoCadastroDebounced])

  const toggleGenero = (g: string) => setGeneros((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const limparFiltros = () => {
    setEstados([]); setGeneros([]); setCidades([]); setOrigens([])
    setPais(""); setIdadeMin(""); setIdadeMax(""); setBusca("")
    setBuscaId(""); setRamal(""); setAnoCadastro(""); setSemRamal(false); setPagina(1)
  }

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token não encontrado.")
      const res = await fetch(`${API_BASE}/export/clientes`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Erro ao exportar CSV")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch (e: any) { alert(e.message ?? "Erro ao exportar CSV") }
  }

  const totalPaginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const idadeAtiva = idadeMin !== "" || idadeMax !== ""
  const filtrosAtivos = estados.length + generos.length + cidades.length + origens.length + (pais ? 1 : 0) + (ramal ? 1 : 0) + (semRamal ? 1 : 0) + (idadeAtiva ? 1 : 0) + (buscaId ? 1 : 0)
  const primeiroItem = total === 0 ? 0 : (pagina - 1) * PER_PAGE + 1
  const ultimoItem = Math.min(pagina * PER_PAGE, total)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPaginas <= 7) { for (let i = 1; i <= totalPaginas; i++) pages.push(i) }
    else {
      pages.push(1)
      let start = Math.max(2, pagina - 1), end = Math.min(totalPaginas - 1, pagina + 1)
      if (pagina <= 3) end = 4
      else if (pagina >= totalPaginas - 2) start = totalPaginas - 3
      if (start > 2) pages.push("...")
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPaginas - 1) pages.push("...")
      pages.push(totalPaginas)
    }
    return pages
  }

  // ── se há cliente 360 selecionado, renderiza a view 360 ────────────────
  if (clienteId360) {
    return (
      <Cliente360View
        clienteId={clienteId360}
        onVoltar={() => setClienteId360(null)}
      />
    )
  }

  // ── lista normal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-primary">Clientes</h1>
        <p className="text-body-2 text-gray-500 mt-1">Visualize e gerencie sua base de clientes</p>
      </div>

      {loading ? (
        <LoadingState />
      ) : erro ? (
        <ErrorState error={erro} onRetry={modoIdExato ? fetchPorId : fetchClientes} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ClienteCardKPI title="Total de Clientes" value={formatNumber(total)} icon={Users} iconBg="bg-primary-50" iconColor="text-primary" />
          </div>

          {/* ── Filtros ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="h-5 w-5" /></span>
                <input type="text" placeholder="Buscar por nome ou e-mail..." value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1) }} disabled={modoIdExato}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed" />
              </div>
              <Button size="lg" intent="secondary" leftIcon={<Download className="h-5 w-5" />} onClick={exportCSV}>Exportar CSV</Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400"><Search className="h-4 w-4" /></span>
                <input type="text" placeholder="Buscar por ID exato do cliente..." value={buscaId} onChange={(e) => { setBuscaId(e.target.value); setPagina(1) }}
                  className={`w-full pl-10 pr-8 py-2.5 rounded-lg border text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 ${modoIdExato ? "border-primary bg-primary-50/20 font-medium text-primary" : "border-gray-200"}`} />
                {buscaId && <button onClick={() => { setBuscaId(""); setPagina(1) }} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-gray-500"><X className="h-4 w-4" /></button>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Gênero:</span>
                {GENEROS_OPCOES.map((g) => <FilterChip key={g} label={g} active={generos.includes(g)} onClick={() => { toggleGenero(g); setPagina(1) }} />)}
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Estado:</span>
                <MultiSelect opcoes={ESTADOS_OPCOES} selecionados={estados} onChange={(novos) => { setEstados(novos); setPagina(1) }} placeholder="Todos os estados" buscavel />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Cidade:</span>
                <MultiSelect opcoes={cidadesDisponiveis} selecionados={cidades} onChange={(novos) => { setCidades(novos); setPagina(1) }} placeholder="Todas as cidades" buscavel />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Ramal:</span>
                <div className="relative flex items-center gap-2">
                  <div className="relative">
                    <input type="text" placeholder="Ex: 3019" value={ramal} disabled={semRamal} onChange={(e) => setRamal(e.target.value)}
                      className={`pl-3 pr-7 py-2 rounded-lg border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 w-28 ${semRamal ? "opacity-40 cursor-not-allowed bg-gray-50" : ""} ${ramal && !semRamal ? "border-primary-200 bg-primary-50/20 text-primary font-medium" : "border-gray-200 bg-white"}`} />
                    {ramal && !semRamal && <button onClick={() => setRamal("")} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300 hover:text-gray-500"><X className="h-3.5 w-3.5" /></button>}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={semRamal} onChange={(e) => { setSemRamal(e.target.checked); if (e.target.checked) setRamal(""); setPagina(1) }} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">Sem ramal</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-caption font-medium text-gray-400 w-14 shrink-0">Origem:</span>
                {ORIGENS_OPCOES.map((o) => <FilterChip key={o} label={o} active={origens.includes(o)} onClick={() => { setOrigens((prev) => prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]); setPagina(1) }} />)}
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">País:</span>
                <div className="relative">
                  <input type="text" placeholder="Ex: Brasil" value={pais} onChange={(e) => { setPais(e.target.value); setPagina(1) }}
                    className={`pl-3 pr-7 py-2 rounded-lg border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 w-36 ${pais ? "border-primary-200 bg-primary-50/20 text-primary font-medium" : "border-gray-200 bg-white"}`} />
                  {pais && <button onClick={() => { setPais(""); setPagina(1) }} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300 hover:text-gray-500"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Ano Cadastro:</span>
                <div className="relative">
                  <input type="text" placeholder="Ex: 2022" value={ano_cadastro} onChange={(e) => setAnoCadastro(e.target.value)}
                    className={`pl-3 pr-7 py-2 rounded-lg border text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200 w-36 ${ano_cadastro ? "border-primary-200 bg-primary-50/20 text-primary font-medium" : "border-gray-200 bg-white"}`} />
                  {ano_cadastro && <button onClick={() => setAnoCadastro("")} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300 hover:text-gray-500"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-200 mx-1 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-caption font-medium text-gray-400 shrink-0">Idade:</span>
                <RangeIdade min={idadeMin} max={idadeMax} onMinChange={(v) => { setIdadeMin(v); setPagina(1) }} onMaxChange={(v) => { setIdadeMax(v); setPagina(1) }} />
              </div>
            </div>

            {modoIdExato && (
              <p className="text-xs text-primary bg-primary-50/50 border border-primary-100 rounded-lg px-3 py-1.5">
                Buscando por ID exato — outros filtros desativados.{" "}
                <button onClick={() => setBuscaId("")} className="underline hover:no-underline font-medium">Limpar ID</button>
              </p>
            )}

            {filtrosAtivos > 0 && (
              <div className="pt-0.5">
                <button onClick={limparFiltros} className="text-caption text-gray-400 hover:text-error underline underline-offset-2 transition-colors">
                  Limpar todos os filtros ({filtrosAtivos})
                </button>
              </div>
            )}
          </div>

          {/* ── Tabela ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {clientes.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                {modoIdExato ? "Nenhum cliente encontrado com este ID." : "Nenhum cliente encontrado para os filtros selecionados."}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["ID do Cliente", "Nome", "E-mail", "Telefone", "Ramal", "Gênero", "Idade", "Dt. Nascimento", "Dt. Cadastro", "Endereço", "Cidade", "Estado", "País", "Origem"].map((col) => (
                          <th key={col} className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {clientes.map((c) => (
                        <tr key={c.id_cliente}
                          onClick={() => setClienteId360(c.id_cliente)}
                          className="hover:bg-primary-50/30 transition-colors duration-150 text-body-2 text-gray-700 cursor-pointer group"
                          title="Clique para ver visão 360"
                        >
                          <td className="px-6 py-4 font-mono text-xs text-gray-500 tracking-tight group-hover:text-primary transition-colors">{c.id_cliente}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap group-hover:text-primary transition-colors">{c.nome_cliente} {c.sobrenome_cliente}</td>
                          <td className="px-6 py-4 text-gray-600">{c.email_cliente}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{c.telefone_cliente}</td>
                          <td className="px-6 py-4 text-gray-500 text-center">{c.ramal_cliente ?? <span className="text-gray-300">—</span>}</td>
                          <td className="px-6 py-4"><GenderBadge g={c.genero_cliente} /></td>
                          <td className="px-6 py-4 text-gray-600 text-center">{c.idade != null ? c.idade : "—"}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{c.data_nascimento_cliente ?? <span className="text-gray-300">—</span>}</td>
                          <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{c.data_cadastro_cliente}</td>
                          <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={c.endereco_cliente ?? ""}>{c.endereco_cliente ?? <span className="text-gray-300">—</span>}</td>
                          <td className="px-6 py-4 text-gray-600">{c.cidade_cliente}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">{c.estado_cliente}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{c.pais_cliente}</td>
                          <td className="px-6 py-4">
                            {c.origem_cliente && <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-700">{c.origem_cliente}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* hint de clique */}
                <div className="px-6 py-2 bg-gray-50/50 border-t border-gray-100">
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    Clique em qualquer linha para abrir a visão 360 do cliente
                  </p>
                </div>

                {!modoIdExato && (
                  <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
                    <div className="text-caption text-gray-500 font-medium order-2 sm:order-1">
                      Mostrando <span className="font-semibold text-gray-700">{primeiroItem}</span> a <span className="font-semibold text-gray-700">{ultimoItem}</span> de <span className="font-semibold text-gray-700">{formatNumber(total)}</span> clientes
                    </div>
                    <div className="flex items-center gap-1 order-1 sm:order-2">
                      <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer">
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>
                      {getPageNumbers().map((page, idx) =>
                        page === "..." ? (
                          <span key={`e-${idx}`} className="px-2 text-gray-400 font-bold text-caption">...</span>
                        ) : (
                          <button key={`p-${page}`} onClick={() => setPagina(page as number)}
                            className={`h-8 w-8 rounded-lg text-caption font-semibold transition-all duration-150 cursor-pointer ${pagina === page ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
                            {page}
                          </button>
                        )
                      )}
                      <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer">
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
