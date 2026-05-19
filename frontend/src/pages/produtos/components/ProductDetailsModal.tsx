import { useState } from "react"
import { 
  X, 
  TrendingUp, 
  Star, 
  MessageSquare, 
  Globe, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  TrendingDown,

  Layers,
  Scale,
  Award,
  DollarSign,
  Package,
  ArrowRight,
  ShieldCheck
} from "lucide-react"
import type { ProdutoMetricas } from "../../../types"
import { Button } from "../../../components/ui/Button"

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: ProdutoMetricas | null
}

type TabType = "vendas" | "avaliacoes" | "web"

// ----------------- HELPERS DE FORMATAÇÃO -----------------
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "0"
  return new Intl.NumberFormat("pt-BR").format(value)
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "N/A"
  try {
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
    const [year, month, day] = dateOnly.split("-")
    if (year && month && day) {
      return `${day}/${month}/${year}`
    }
    return dateStr
  } catch {
    return dateStr
  }
}

// ----------------- COMPONENTE PRINCIPAL -----------------
export default function ProductDetailsModal({
  isOpen,
  onClose,
  product
}: ProductDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("vendas")

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md transition-all duration-300 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden transform scale-100 transition-all duration-300">
        
        {/* Cabeçalho */}
        <ProductHeader product={product} onClose={onClose} />

        {/* Sub-barra de Informações Básicas */}
        <ProductSubBar product={product} />

        {/* Abas de Navegação */}
        <ProductTabsNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Corpo do Modal (Abas Temáticas) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[50vh]">
          {activeTab === "vendas" && <SalesTab product={product} />}
          {activeTab === "avaliacoes" && <SatisfactionTab product={product} />}
          {activeTab === "web" && <WebBehaviorTab product={product} />}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50/50">
          <Button size="md" variant="outlined" intent="secondary" onClick={onClose}>
            Fechar Detalhes
          </Button>
        </div>

      </div>
    </div>
  )
}

// ----------------- SUBCOMPONENTES SUPORTE -----------------

function ProductHeader({ product, onClose }: { product: ProdutoMetricas; onClose: () => void }) {
  return (
    <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-mono font-bold bg-primary-50 text-primary-500 px-2.5 py-1 rounded-md tracking-wider border border-primary-100">
            {product.id_produto}
          </span>
          <span className={`px-2.5 py-1 text-caption font-semibold rounded-md flex items-center gap-1.5 border ${
            product.produto_ativo 
              ? "bg-success-50 text-success border-success-100" 
              : "bg-gray-100 text-gray-500 border-gray-200"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${product.produto_ativo ? "bg-success animate-pulse" : "bg-gray-400"}`} />
            {product.produto_ativo ? "Ativo" : "Inativo"}
          </span>
          {product.status_comercial_produto && (
            <span className="bg-secondary-50 text-secondary border border-secondary-100 px-2.5 py-1 rounded-md text-caption font-semibold flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-secondary" />
              {product.status_comercial_produto}
            </span>
          )}
        </div>
        <h2 className="text-h3 font-heading text-gray-900 leading-tight">
          {product.nome_produto}
        </h2>
        <p className="text-caption text-gray-500">
          Categoria: <strong className="text-gray-700 font-semibold">{product.categoria_produto}</strong> &bull; Fornecedor: <strong className="text-gray-700 font-semibold">{product.fornecedor_produto || "Não Informado"}</strong>
        </p>
      </div>
      <button 
        onClick={onClose}
        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 self-start mt-0.5"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}

function ProductSubBar({ product }: { product: ProdutoMetricas }) {
  return (
    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-3 gap-6 text-left">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-50 text-primary rounded-xl hidden sm:block">
          <DollarSign className="h-5 w-5" />
        </div>
        <div>
          <span className="text-caption text-gray-400 block font-medium">Preço Unitário</span>
          <span className="text-subtitle-2 font-bold text-primary mt-0.5 block">{formatCurrency(product.preco_produto)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 border-x border-gray-100 px-4 sm:px-6">
        <div className="p-2 bg-primary-50 text-primary rounded-xl hidden sm:block">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <span className="text-caption text-gray-400 block font-medium">Estoque Atual</span>
          <span className="text-subtitle-2 font-bold text-gray-800 mt-0.5 block">
            {formatNumber(product.estoque_produto)} <span className="text-caption font-normal text-gray-500">un</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 pl-2">
        <div className="p-2 bg-primary-50 text-primary rounded-xl hidden sm:block">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <span className="text-caption text-gray-400 block font-medium">Peso Líquido</span>
          <span className="text-subtitle-2 font-bold text-gray-800 mt-0.5 block">
            {product.peso_kg_produto ? `${product.peso_kg_produto.toFixed(2)} kg` : "N/A"}
          </span>
        </div>
      </div>
    </div>
  )
}

function ProductTabsNavigation({
  activeTab,
  setActiveTab
}: {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}) {
  return (
    <div className="flex border-b border-gray-100 bg-white px-2">
      <button
        onClick={() => setActiveTab("vendas")}
        className={`flex-1 py-3 text-caption font-semibold border-b-2 text-center transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          activeTab === "vendas"
            ? "border-primary text-primary bg-primary-50/10 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
        }`}
      >
        <TrendingUp className="h-4 w-4" />
        Desempenho Comercial
      </button>
      <button
        onClick={() => setActiveTab("avaliacoes")}
        className={`flex-1 py-3 text-caption font-semibold border-b-2 text-center transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          activeTab === "avaliacoes"
            ? "border-primary text-primary bg-primary-50/10 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
        }`}
      >
        <Star className="h-4 w-4" />
        Satisfação & Suporte
      </button>
      <button
        onClick={() => setActiveTab("web")}
        className={`flex-1 py-3 text-caption font-semibold border-b-2 text-center transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
          activeTab === "web"
            ? "border-primary text-primary bg-primary-50/10 font-bold"
            : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
        }`}
      >
        <Globe className="h-4 w-4" />
        Comportamento Web
      </button>
    </div>
  )
}

function SalesTab({ product }: { product: ProdutoMetricas }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Card de Faturamento */}
        <div className="bg-gradient-to-br from-success-50/30 to-success-100/10 border border-success-100/50 p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:shadow-sm">
          <div className="p-3 bg-success-100/60 text-success-500 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-caption text-gray-400 block font-medium">Receita Acumulada</span>
            <h4 className="text-h3 font-bold text-success-500 mt-0.5">{formatCurrency(product.receita_total)}</h4>
          </div>
        </div>

        {/* Card de Unidades Vendidas */}
        <div className="bg-gradient-to-br from-primary-50/30 to-primary-100/10 border border-primary-100/50 p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:shadow-sm">
          <div className="p-3 bg-primary-100/60 text-primary-300 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-caption text-gray-400 block font-medium">Unidades Vendidas</span>
            <h4 className="text-h3 font-bold text-primary-400 mt-0.5">
              {formatNumber(product.quantidade_vendida)} <span className="text-caption font-normal text-gray-400">un</span>
            </h4>
          </div>
        </div>

        {/* Card de Total Pedidos */}
        <div className="bg-gradient-to-br from-secondary-50/30 to-secondary-100/10 border border-secondary-100/50 p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:shadow-sm">
          <div className="p-3 bg-secondary-100/60 text-secondary-300 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-caption text-gray-400 block font-medium">Pedidos Efetuados</span>
            <h4 className="text-subtitle-1 font-bold text-gray-800 mt-0.5">{formatNumber(product.total_pedidos)} pedidos</h4>
          </div>
        </div>

        {/* Card de Ticket Médio */}
        <div className="bg-gradient-to-br from-warning-50/30 to-warning-100/10 border border-warning-100/50 p-4 rounded-xl flex items-center gap-4 transition-all duration-300 hover:shadow-sm">
          <div className="p-3 bg-warning-100/60 text-warning-400 rounded-xl">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <span className="text-caption text-gray-400 block font-medium">Ticket Médio por Venda</span>
            <h4 className="text-subtitle-1 font-bold text-gray-800 mt-0.5">{formatCurrency(product.ticket_medio)}</h4>
          </div>
        </div>
      </div>

      {/* Logística refinada focada em Reembolsos */}
      <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-caption font-bold text-gray-700 uppercase tracking-wider">Logística e Desempenho de Entrega</h3>
          <span className="text-caption text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-md">Pós-Venda</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-warning-50 text-warning-400 rounded-xl">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-caption text-gray-400 block font-medium">Pedidos Reembolsados</span>
              <span className="text-[11px] text-gray-500 mt-0.5">Solicitações de reembolso processadas e aprovadas pelo pós-venda.</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-h3 font-bold text-warning-500 block">
              {formatNumber(product.pedidos_reembolsados)}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">unidades</span>
          </div>
        </div>
      </div>

      {/* Datas Comerciais com visual de Timeline */}
      <div className="border border-gray-100 rounded-xl p-4.5 bg-white shadow-sm flex flex-col sm:flex-row justify-between gap-4 text-caption text-gray-500">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400">Primeira Venda</span>
            <span className="text-gray-700 font-semibold text-caption mt-0.5 block">{formatDate(product.data_primeira_venda)}</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center text-gray-300">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-50 text-gray-400 rounded-lg">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-gray-400">Última Venda Registrada</span>
            <span className="text-gray-700 font-semibold text-caption mt-0.5 block">{formatDate(product.data_ultima_venda)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SatisfactionTab({ product }: { product: ProdutoMetricas }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Nota Média */}
        <div className="bg-gradient-to-b from-warning-50/20 to-warning-100/10 border border-warning-100/50 p-4 rounded-xl text-center flex flex-col items-center justify-between shadow-sm">
          <span className="text-caption font-bold text-warning-500 uppercase tracking-wider block">Nota CRM</span>
          <div className="flex items-center gap-1.5 my-2 text-warning-400 font-extrabold text-h2">
            <Star className="h-6 w-6 fill-warning text-warning shrink-0" />
            {product.nota_media ? product.nota_media.toFixed(1) : "0.0"}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{product.total_avaliacoes} avaliações</span>
        </div>

        {/* NPS Médio */}
        <div className="bg-gradient-to-b from-primary-50/20 to-primary-100/10 border border-primary-100/50 p-4 rounded-xl text-center flex flex-col items-center justify-between shadow-sm">
          <span className="text-caption font-bold text-primary block uppercase tracking-wider">NPS Médio</span>
          <div className="my-2 text-primary font-extrabold text-h2">
            {product.nps_medio ? product.nps_medio.toFixed(1) : "0.0"}
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">Meta Rocketlab &ge; 70</span>
        </div>

        {/* Taxa de Recomendação */}
        <div className="bg-gradient-to-b from-success-50/20 to-success-100/10 border border-success-100/50 p-4 rounded-xl text-center flex flex-col items-center justify-between shadow-sm">
          <span className="text-caption font-bold text-success-500 block uppercase tracking-wider">Recomendação</span>
          <div className="flex items-baseline justify-center gap-0.5 my-2 text-success font-extrabold text-h2">
            {product.taxa_recomendacao ? product.taxa_recomendacao.toFixed(0) : "0"}
            <span className="text-caption font-bold">%</span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold">Índice Geral</span>
        </div>
      </div>

      {/* Suporte Técnico */}
      <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30">
        <h3 className="text-caption font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          Métricas de Suporte Técnico
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-caption text-gray-400 block font-medium">Tickets de Suporte</span>
              <span className="text-subtitle-1 font-bold text-gray-800 mt-1 block">{formatNumber(product.total_tickets)} chamados</span>
            </div>
            {product.produto_com_alto_volume_suporte && (
              <span className="bg-error-50 text-error border border-error-100 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" />
                Crítico
              </span>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-caption text-gray-400 block font-medium">Tempo Médio de Resolução</span>
              <span className="text-subtitle-1 font-bold text-gray-800 mt-1 block">
                {product.tempo_medio_resolucao_produto ? `${product.tempo_medio_resolucao_produto.toFixed(1)} horas` : "N/A"}
              </span>
            </div>
            <Clock className="h-6 w-6 text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WebBehaviorTab({ product }: { product: ProdutoMetricas }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs Horizontal Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-center">
          <span className="text-caption text-gray-400 block font-medium">Total Eventos</span>
          <span className="text-caption font-bold text-gray-800 mt-1 block">{formatNumber(product.total_eventos_produto)}</span>
        </div>
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-center">
          <span className="text-caption text-gray-400 block font-medium">Sessões</span>
          <span className="text-caption font-bold text-gray-800 mt-1 block">{formatNumber(product.total_sessoes_produto)}</span>
        </div>
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-center">
          <span className="text-caption text-gray-400 block font-medium">Visualizações</span>
          <span className="text-caption font-bold text-gray-800 mt-1 block">{formatNumber(product.total_pageviews_produto)}</span>
        </div>
        <div className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-center">
          <span className="text-caption text-gray-400 block font-medium">No Carrinho</span>
          <span className="text-caption font-bold text-gray-800 mt-1 block">{formatNumber(product.total_add_carrinho_produto)}</span>
        </div>
      </div>

      {/* Taxas de Conversão (Informativo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <span className="text-caption text-gray-400 font-medium">Taxa de Adição ao Carrinho</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-h3 font-bold text-gray-800">
              {product.total_pageviews_produto && product.total_pageviews_produto > 0 
                ? ((product.total_add_carrinho_produto || 0) / product.total_pageviews_produto * 100).toFixed(1) + "%" 
                : "0%"}
            </span>
          </div>
          <span className="text-caption text-gray-400 mt-2 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
            <strong>{product.total_add_carrinho_produto || 0}</strong> adicionaram de <strong>{product.total_pageviews_produto}</strong> visitas
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
          <span className="text-caption text-gray-400 font-medium">Conversão de Compra (Checkout)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-h3 font-bold text-success">
              {product.total_add_carrinho_produto && product.total_add_carrinho_produto > 0 
                ? ((product.total_eventos_compra_produto || 0) / product.total_add_carrinho_produto * 100).toFixed(1) + "%" 
                : "0%"}
            </span>
          </div>
          <span className="text-caption text-gray-400 mt-2 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
            <strong>{product.total_eventos_compra_produto || 0}</strong> compraram de <strong>{product.total_add_carrinho_produto}</strong> adições
          </span>
        </div>

        <div className="bg-primary-50/30 p-4 rounded-xl border border-primary-100/50 shadow-sm flex flex-col justify-between h-full sm:col-span-2">
          <span className="text-caption text-primary-600 font-medium">Taxa de Conversão Global do Produto</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-h2 font-extrabold text-primary-500">
              {product.total_pageviews_produto && product.total_pageviews_produto > 0 
                ? ((product.total_eventos_compra_produto || 0) / product.total_pageviews_produto * 100).toFixed(1) + "%" 
                : "0%"}
            </span>
            <span className="text-caption text-primary-400 font-medium">do tráfego total</span>
          </div>
          <span className="text-caption text-primary-500 mt-2">
            Total de <strong>{product.total_eventos_compra_produto || 0}</strong> compras efetuadas.
          </span>
        </div>
      </div>
    </div>
  )
}
