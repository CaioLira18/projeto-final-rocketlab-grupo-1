import { useEffect, useState } from "react"
import {
  X, User, ShoppingBag, Headphones, Star, Activity,
  TrendingUp, Clock, Package, TicketCheck, MessageSquare,
  ShoppingCart, Eye, CheckCircle, XCircle, RefreshCw,
  Calendar, MapPin, Phone, Mail, Globe,
} from "lucide-react"
import { apiFetch } from "@/services"
import { Button } from "@/components/ui"

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Cliente360 {
  id_cliente: string
  nome_cliente?: string
  sobrenome_cliente?: string
  nome_completo_cliente?: string
  email_cliente?: string
  telefone_cliente?: string
  genero_cliente?: string
  cidade_cliente?: string
  estado_cliente?: string
  pais_cliente?: string
  origem_cliente?: string
  data_cadastro_cliente?: string
  idade_cliente?: number
  // compras
  total_pedidos?: number
  receita_total_cliente?: number
  ticket_medio_cliente?: number
  total_itens_comprados?: number
  data_primeira_compra?: string
  data_ultima_compra?: string
  recencia_dias?: number
  pedidos_entregues?: number
  pedidos_cancelados?: number
  pedidos_reembolsados?: number
  // suporte
  total_tickets?: number
  tickets_abertos?: number
  tickets_fechados?: number
  tempo_medio_resolucao_horas?: number
  nota_media_atendimento?: number
  data_ultimo_ticket?: string
  // avaliações
  total_avaliacoes?: number
  nota_media_produto?: number
  nps_medio_cliente?: number
  taxa_recomendacao_cliente?: number
  data_ultima_avaliacao?: string
  // engajamento
  total_sessoes?: number
  total_eventos?: number
  tempo_medio_pagina_seg?: number
  data_ultimo_evento?: string
  eventos_compra?: number
  eventos_add_carrinho?: number
  eventos_pageview?: number
  // segmento
  faixa_valor_cliente?: string
  cliente_ativo_90d?: boolean
}

interface Cliente360ModalProps {
  clienteId: string
  nomeCliente: string
  onClose: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(value: string | null | undefined) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function fmtMoney(value: number | null | undefined) {
  if (value == null) return "-"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtNum(value: number | null | undefined, fallback = "-") {
  if (value == null) return fallback
  return value.toLocaleString("pt-BR")
}

function fmtPct(value: number | null | undefined) {
  if (value == null) return "-"
  return `${(value * 100).toFixed(0)}%`
}

function Stars({ value }: { value: number | undefined | null }) {
  if (value == null) return <span className="text-gray-400 text-sm">-</span>
  const rounded = Math.round(value * 2) / 2
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= rounded ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
      <span className="text-xs text-gray-500 ml-1">{value.toFixed(1)}</span>
    </span>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "blue",
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  accent?: "blue" | "green" | "amber" | "rose" | "purple" | "teal"
}) {
  const accentMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600",
    green:  "bg-emerald-50 text-emerald-600",
    amber:  "bg-amber-50 text-amber-600",
    rose:   "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
    teal:   "bg-teal-50 text-teal-600",
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`p-2 rounded-lg shrink-0 ${accentMap[accent]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
        <p className="text-base font-bold text-dark mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</h3>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Cliente360Modal({ clienteId, nomeCliente, onClose }: Cliente360ModalProps) {
  const [data, setData]       = useState<Cliente360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    apiFetch<Cliente360>(`/clientes/360/${clienteId}`)
      .then(d => setData(d))
      .catch(() => setError("Não foi possível carregar a visão 360 deste cliente."))
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [clienteId])

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const d = data

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div className="relative bg-gray-50 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary font-bold text-base">
              {nomeCliente.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-dark leading-tight">{nomeCliente}</h2>
              <p className="text-xs text-gray-400 font-mono">{clienteId}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {d && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                d.cliente_ativo_90d
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-gray-100 text-gray-500"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${d.cliente_ativo_90d ? "bg-emerald-500" : "bg-gray-400"}`} />
                {d.cliente_ativo_90d ? "Ativo (90d)" : "Inativo"}
              </span>
            )}
            {d?.faixa_valor_cliente && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary">
                {d.faixa_valor_cliente}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Carregando visão 360…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
              <XCircle className="w-10 h-10 text-rose-300" />
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          )}

          {!loading && !error && d && (
            <>
              {/* ── Informações Pessoais ─────────────────────────── */}
              <section>
                <SectionTitle icon={User} label="Informações Pessoais" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={Mail}     label="E-mail"        value={d.email_cliente     ?? "-"} accent="blue" />
                  <StatCard icon={Phone}    label="Telefone"      value={d.telefone_cliente  ?? "-"} accent="blue" />
                  <StatCard icon={User}     label="Gênero / Idade" value={`${d.genero_cliente ?? "-"} · ${d.idade_cliente ?? "-"} anos`} accent="purple" />
                  <StatCard icon={MapPin}   label="Localização"   value={`${d.cidade_cliente ?? "-"}, ${d.estado_cliente ?? "-"}`} sub={d.pais_cliente} accent="teal" />
                  <StatCard icon={Globe}    label="Origem"        value={d.origem_cliente    ?? "-"} accent="teal" />
                  <StatCard icon={Calendar} label="Cadastro"      value={fmt(d.data_cadastro_cliente)} accent="blue" />
                </div>
              </section>

              {/* ── Compras ──────────────────────────────────────── */}
              <section>
                <SectionTitle icon={ShoppingBag} label="Compras" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={ShoppingBag}  label="Total de Pedidos"     value={fmtNum(d.total_pedidos)}          accent="blue" />
                  <StatCard icon={TrendingUp}   label="Receita Total"         value={fmtMoney(d.receita_total_cliente)} accent="green" />
                  <StatCard icon={TrendingUp}   label="Ticket Médio"          value={fmtMoney(d.ticket_medio_cliente)}  accent="green" />
                  <StatCard icon={Package}      label="Itens Comprados"       value={fmtNum(d.total_itens_comprados)}  accent="blue" />
                  <StatCard icon={Clock}        label="Recência"              value={d.recencia_dias != null ? `${d.recencia_dias} dias` : "-"} sub={`Última compra: ${fmt(d.data_ultima_compra)}`} accent="amber" />
                  <StatCard icon={Calendar}     label="1ª Compra"             value={fmt(d.data_primeira_compra)}      accent="blue" />
                </div>

                {/* Barra de status de pedidos */}
                {(d.pedidos_entregues || d.pedidos_cancelados || d.pedidos_reembolsados) ? (
                  <div className="mt-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-3">Status dos Pedidos</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-bold">{fmtNum(d.pedidos_entregues)}</span>
                        <span className="text-xs text-gray-400">entregues</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <XCircle className="w-4 h-4" />
                        <span className="font-bold">{fmtNum(d.pedidos_cancelados)}</span>
                        <span className="text-xs text-gray-400">cancelados</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-500">
                        <RefreshCw className="w-4 h-4" />
                        <span className="font-bold">{fmtNum(d.pedidos_reembolsados)}</span>
                        <span className="text-xs text-gray-400">reembolsados</span>
                      </span>
                    </div>
                  </div>
                ) : null}
              </section>

              {/* ── Suporte ──────────────────────────────────────── */}
              <section>
                <SectionTitle icon={Headphones} label="Suporte" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={TicketCheck}   label="Total de Tickets"       value={fmtNum(d.total_tickets)}                                     accent="purple" />
                  <StatCard icon={TicketCheck}   label="Abertos / Fechados"     value={`${fmtNum(d.tickets_abertos)} / ${fmtNum(d.tickets_fechados)}`} accent="rose"   />
                  <StatCard icon={Clock}         label="Tempo Médio Resolução"  value={d.tempo_medio_resolucao_horas != null ? `${d.tempo_medio_resolucao_horas.toFixed(1)}h` : "-"} accent="amber" />
                  <StatCard icon={Star}          label="Nota Média Atendimento" value={<Stars value={d.nota_media_atendimento} />}                   accent="amber" />
                  <StatCard icon={Calendar}      label="Último Ticket"          value={(d.data_ultimo_ticket)}                                    accent="blue"   />
                </div>
              </section>

              {/* ── Avaliações ────────────────────────────────────── */}
              <section>
                <SectionTitle icon={Star} label="Avaliações" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={Star}          label="Total de Avaliações"  value={fmtNum(d.total_avaliacoes)}               accent="amber" />
                  <StatCard icon={Star}          label="Nota Média Produto"   value={<Stars value={d.nota_media_produto} />}    accent="amber" />
                  <StatCard icon={TrendingUp}    label="NPS Médio"            value={d.nps_medio_cliente != null ? d.nps_medio_cliente.toFixed(1) : "-"} accent="green" />
                  <StatCard icon={TrendingUp}    label="Taxa de Recomendação" value={fmtPct(d.taxa_recomendacao_cliente)}       accent="green" />
                  <StatCard icon={Calendar}      label="Última Avaliação"     value={fmt(d.data_ultima_avaliacao)}              accent="blue"  />
                </div>
              </section>

              {/* ── Engajamento ───────────────────────────────────── */}
              <section>
                <SectionTitle icon={Activity} label="Engajamento Digital" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={Activity}      label="Total de Sessões"       value={fmtNum(d.total_sessoes)}   accent="teal" />
                  <StatCard icon={Activity}      label="Total de Eventos"       value={fmtNum(d.total_eventos)}   accent="teal" />
                  <StatCard icon={Clock}         label="Tempo Médio na Página"  value={d.tempo_medio_pagina_seg != null ? `${d.tempo_medio_pagina_seg.toFixed(0)}s` : "-"} accent="blue" />
                  <StatCard icon={ShoppingCart}  label="Eventos de Compra"      value={fmtNum(d.eventos_compra)}  accent="green" />
                  <StatCard icon={ShoppingCart}  label="Add ao Carrinho"        value={fmtNum(d.eventos_add_carrinho)} accent="amber" />
                  <StatCard icon={Eye}           label="Page Views"             value={fmtNum(d.eventos_pageview)} accent="purple" />
                </div>
                {d.data_ultimo_evento && (
                  <p className="mt-2 text-xs text-gray-400 text-right">
                    Último evento: {fmt(d.data_ultimo_evento)}
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && (
          <div className="bg-white border-t border-gray-100 px-6 py-3 shrink-0 flex justify-end">
            <Button variant="outlined" intent="secondary" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cliente360Modal
