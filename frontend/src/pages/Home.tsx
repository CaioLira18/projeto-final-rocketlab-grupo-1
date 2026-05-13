import { useEffect, useState } from "react"
import { apiFetch } from "@/services"
import type { DashboardKPIs } from "@/types"
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Layers,
  MapPin,
  CreditCard,
  UserCheck,
  XCircle
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

// ----------------- CONFIGURAÇÕES DE CORES -----------------
const COLORS_CATEGORY = [
  "#1A2B4C",
  "#7C3AED",
  "#0066FF",
  "#22C55E",
  "#F59E0B",
  "#EF4444"
]

const COLORS_PAYMENT = [
  "#7C3AED", // Pix 
  "#0066FF", // Cartão 
  "#F59E0B", // Boleto 
  "#22C55E"  // Outros 
]

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

// ----------------- TOOLTIP CUSTOMIZADO -----------------
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-gray-100 rounded-xl shadow-lg text-caption">
        <p className="font-bold text-gray-800 mb-1">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} style={{ color: item.color }} className="font-semibold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}: <span className="text-gray-900 font-bold">{item.name.toLowerCase().includes("receita") || item.name.toLowerCase().includes("faturamento") ? formatCurrency(item.value) : formatNumber(item.value)}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export const Home = () => {
  const [data, setData] = useState<DashboardKPIs | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchKPIs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<DashboardKPIs>("/dashboard/kpis")
      setData(res)
    } catch (err: any) {
      setError(err.message || "Não foi possível carregar os dados do dashboard.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchKPIs()
  }, [])

  // ----------------- LOADING SKELETONS -----------------
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 rounded-md" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-36 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-50 rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white border border-gray-100 rounded-2xl shadow-sm" />
          <div className="h-96 bg-white border border-gray-100 rounded-2xl shadow-sm" />
        </div>
      </div>
    )
  }

  // ----------------- ERROR SCREEN -----------------
  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-4 bg-error-50 text-error rounded-2xl mb-4">
          <XCircle className="h-12 w-12 animate-bounce" />
        </div>
        <h2 className="text-h2 font-heading text-gray-900 mb-2">Erro de Carregamento</h2>
        <p className="text-body-2 text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={() => fetchKPIs()}
          className="px-5 py-2.5 bg-primary text-white text-caption font-semibold rounded-xl flex items-center gap-2 hover:bg-primary-400 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </button>
      </div>
    )
  }

  // ----------------- RENDER VIEW -----------------
  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-h1 text-gray-900 font-heading">Dashboard de Controle</h1>
          </div>
          <p className="text-body-2 text-gray-500 mt-1">
            Acompanhamento integrado de vendas, receita consolidada, distribuição geográfica e segmentação de clientes.
          </p>
        </div>
        <button
          onClick={() => fetchKPIs(true)}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-50/50 hover:shadow-sm text-caption font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? "animate-spin text-primary" : ""}`} />
          {refreshing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {/* Grid de KPIs Básicos (Cartões Premium) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Receita Total */}
        <div className="bg-gradient-to-br from-white to-gray-50/10 rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-2">
            <span className="text-caption text-gray-400 uppercase font-bold tracking-wider">Receita Total</span>
            <h2 className="text-h2 text-primary font-bold">{formatCurrency(data?.totalRevenue)}</h2>
            <div className="flex items-center gap-1 text-[10px] text-success font-semibold">
              <TrendingUp className="h-3 w-3" />
              <span>Soma total do faturamento</span>
            </div>
          </div>
          <div className="p-4 bg-primary-50 text-primary-400 rounded-2xl shadow-sm">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2: Volume de Pedidos */}
        <div className="bg-gradient-to-br from-white to-gray-50/10 rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-2">
            <span className="text-caption text-gray-400 uppercase font-bold tracking-wider">Volume de Pedidos</span>
            <h2 className="text-h2 text-gray-800 font-bold">{formatNumber(data?.totalSales)} <span className="text-caption font-normal text-gray-500">un</span></h2>
            <div className="flex items-center gap-1 text-[10px] text-primary-300 font-semibold">
              <ShoppingBag className="h-3 w-3" />
              <span>Pedidos concluídos na base</span>
            </div>
          </div>
          <div className="p-4 bg-primary-50 text-primary-300 rounded-2xl shadow-sm">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3: Base de Clientes */}
        <div className="bg-gradient-to-br from-white to-gray-50/10 rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-2">
            <span className="text-caption text-gray-400 uppercase font-bold tracking-wider">Clientes Cadastrados</span>
            <h2 className="text-h2 text-gray-800 font-bold">{formatNumber(data?.totalCustomers)} <span className="text-caption font-normal text-gray-500">base</span></h2>
            <div className="flex items-center gap-1 text-[10px] text-secondary font-semibold">
              <UserCheck className="h-3 w-3" />
              <span>Perfis unificados ativos</span>
            </div>
          </div>
          <div className="p-4 bg-secondary-50 text-secondary-300 rounded-2xl shadow-sm">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4: Ticket Médio */}
        <div className="bg-gradient-to-br from-white to-gray-50/10 rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-2">
            <span className="text-caption text-gray-400 uppercase font-bold tracking-wider">Ticket Médio Geral</span>
            <h2 className="text-h2 text-gray-800 font-bold">{formatCurrency(data?.averageOrderValue)}</h2>
            <div className="flex items-center gap-1 text-[10px] text-warning-400 font-semibold">
              <ArrowUpRight className="h-3 w-3" />
              <span>Valor médio gasto por pedido</span>
            </div>
          </div>
          <div className="p-4 bg-warning-50 text-warning-400 rounded-2xl shadow-sm">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Nível 1: Evolução de Vendas & Top Estados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico 1: Evolução Temporal */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-h3 text-gray-900 font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-300" />
                Histórico Comercial & Evolução Temporal
              </h3>
              <p className="text-[11px] text-gray-400">Curva agregada de faturamento e volume mensal de compras</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.monthlySales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A2B4C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A2B4C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="mes_referencia" tickLine={false} axisLine={false} stroke="#9CA3AF" style={{ fontSize: '11px' }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#1A2B4C" tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} style={{ fontSize: '11px' }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#7C3AED" style={{ fontSize: '11px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} style={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="receita" name="Faturamento (R$)" stroke="#1A2B4C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Line yAxisId="right" type="monotone" dataKey="pedidos" name="Volume de Pedidos" stroke="#7C3AED" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Top Estados */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-h3 text-gray-900 font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-300" />
              Faturamento por Estado
            </h3>
            <p className="text-[11px] text-gray-400">Distribuição dos 10 estados de maior relevância financeira</p>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stateSales} layout="vertical" margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" tickLine={false} axisLine={false} stroke="#9CA3AF" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} style={{ fontSize: '10px' }} />
                <YAxis dataKey="estado" type="category" tickLine={false} axisLine={false} stroke="#374151" width={110} interval={0} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="receita" name="Faturamento por Estado" radius={[0, 4, 4, 0]}>
                  {data?.stateSales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#1A2B4C" : "#3b5585"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Nível 2: Distribuições e Segmentação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico 3: Categorias de Produtos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-h3 text-gray-900 font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary-300" />
              Mix de Vendas por Categoria
            </h3>
            <p className="text-[11px] text-gray-400">Distribuição de receita por nicho de mercado</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.categorySales}
                  dataKey="receita"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data?.categorySales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Customizada */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-500 max-h-24 overflow-y-auto">
            {data?.categorySales.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_CATEGORY[index % COLORS_CATEGORY.length] }} />
                <span className="truncate max-w-[100px] font-semibold">{item.categoria}</span>
                <span className="text-gray-400">({formatCurrency(item.receita).split(",")[0]})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 4: Métodos de Pagamento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-h3 text-gray-900 font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary-300" />
              Preferencia de Pagamentos
            </h3>
            <p className="text-[11px] text-gray-400">Divisão do volume de faturamento por método</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentSales}
                  dataKey="receita"
                  nameKey="metodo"
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  labelLine={false}
                >
                  {data?.paymentSales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_PAYMENT[index % COLORS_PAYMENT.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda Customizada */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-500">
            {data?.paymentSales.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS_PAYMENT[index % COLORS_PAYMENT.length] }} />
                <span className="font-semibold text-gray-700 capitalize">{item.metodo}</span>
                <span className="text-gray-400">({formatCurrency(item.receita).split(",")[0]})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico 5: Segmentação de Clientes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-h3 text-gray-900 font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-300" />
              Classificação dos Clientes (Tiers)
            </h3>
            <p className="text-[11px] text-gray-400">Distribuição quantitativa da base em faixas de valor</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.customerSegments} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="faixa" tickLine={false} axisLine={false} stroke="#374151" style={{ fontSize: '11px', fontWeight: 'bold' }} />
                <YAxis tickLine={false} axisLine={false} stroke="#9CA3AF" style={{ fontSize: '10px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantidade" name="Quantidade de Clientes" radius={[4, 4, 0, 0]}>
                  {data?.customerSegments.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#7C3AED" : index === 1 ? "#1A2B4C" : "#0066FF"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold">Maior Volume Base:</span>
            <span className="font-bold text-secondary text-caption bg-secondary-50 px-2 py-0.5 rounded">
              {data?.customerSegments[0]?.faixa || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
