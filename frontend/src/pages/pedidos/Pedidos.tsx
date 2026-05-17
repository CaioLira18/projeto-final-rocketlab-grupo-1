import { useEffect, useState, useCallback } from "react"
import { ShoppingCart, CheckCircle, XCircle, RefreshCw, Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { apiFetch } from "@/services"
import { type Pedido } from "@/types"

// Helpers para formatação ---

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  Aprovado: { label: "Concluído", className: "bg-success-50 text-success border border-success-200" },
  Recusado: { label: "Falha", className: "bg-error-50 text-error border border-error-200" },
  Reembolsado: { label: "Reembolsado", className: "bg-warning-50 text-warning border border-warning-200" },
  Processando: { label: "Processando", className: "bg-gray-100 text-gray-500 border border-gray-200" },
}

function formatCurrency(value: number | null) {
  if (value == null) return "-"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-400">-</span>
  const config = STATUS_MAP[status] ?? { label: status, className: "bg-gray-100 text-gray-500 border border-gray-200" }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-caption font-semibold ${config.className}`}>
      {config.label}
    </span>
  )
}


// Definindo tipos e constantes ---

interface CountResponse {
  total: number
  aprovados: number
  recusados: number
  reembolsados: number
}

const PAGE_SIZE = 8


// Componente  principal ---
export function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [kpis, setKpis] = useState<CountResponse>({ total: 0, aprovados: 0, recusados: 0, reembolsados: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  //Filtros
  const [busca, setBusca] = useState("")
  const  [buscaInput, setBuscaInput] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")

  //Paginação
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const fetchCounts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (busca)           params.set("nome_cliente", busca)
      if (statusFiltro)    params.set("status", statusFiltro)
      if (dataInicio)      params.set("data_inicio", dataInicio)
      if (dataFim)         params.set("data_fim", dataFim)
      if (categoriaFiltro) params.set("categoria_produto", categoriaFiltro)

      const data = await apiFetch<CountResponse>(`/pedidos/count?${params}`)
      setKpis(data)
      setTotal(data.total)
    } catch {}
  }, [busca, statusFiltro, dataInicio, dataFim, categoriaFiltro])

  const fetchPedidos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const skip = (page - 1) * PAGE_SIZE

      const params = new URLSearchParams({ skip: String(skip), limite: String(PAGE_SIZE) })
      if (busca) {
        if (busca.includes("-") || /^[a-f0-9]+$/i.test(busca)) {
          params.set("id_pedido", busca)
        } else {
          params.set("nome_cliente", busca)
        }
      }
      if (statusFiltro) params.set("status", statusFiltro)
      if (dataInicio)   params.set("data_inicio", dataInicio)
      if (dataFim)      params.set("data_fim", dataFim)
      if (categoriaFiltro) params.set("categoria_produto", categoriaFiltro)
      const pageData = await apiFetch<Pedido[]>(`/pedidos/?${params}`)

      setPedidos(pageData)
    } catch {
      setError("Erro ao carregar pedidos. Verifique se o backend está rodando.")
    } finally {
      setIsLoading(false)
    }
  }, [page, busca, statusFiltro, dataInicio, dataFim, categoriaFiltro])

  useEffect(() => { fetchCounts() }, [fetchCounts])
  useEffect(() => { fetchPedidos() }, [fetchPedidos])
  useEffect(() => { setPage(1) }, [busca, statusFiltro, dataInicio, dataFim, categoriaFiltro])

  //Exportar CSV
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/export/pedidos`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "pedidos.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("Erro ao exportar CSV.")
    }
  }

  //Paginação helper
  function getPageNumbers() {
    const pages: (number | "...")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push("...")
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
      if (page < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  //Configuração dos cards KPI
  const kpiCards = [
    { title: "Total de Pedidos", value: kpis.total, icon: ShoppingCart, iconClass: "text-primary bg-primary-50", valueClass: "text-dark" },
    { title: "Pedidos Concluídos",  value: kpis.aprovados,    icon: CheckCircle,  iconClass: "text-success bg-success-50",  valueClass: "text-success" },
    { title: "Pedidos com Falha",   value: kpis.recusados,    icon: XCircle,      iconClass: "text-error bg-error-50",      valueClass: "text-error" },
    { title: "Reembolsados",        value: kpis.reembolsados, icon: RefreshCw,    iconClass: "text-warning bg-warning-50",  valueClass: "text-warning" },
  ]


  //Render
  return (
    <div className="space-y-6">

      {/*Header*/}
      <div>
        <h1 className="text-h1 text-primary font-heading font-bold">Pedidos</h1>
        <p className="text-body-2 text-gray-500 mt-1">
          Gerencie e acompanhe todos os pedidos da plataforma
        </p>
      </div>

      {/*KPI cards*/}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
              <div>
                <p className="text-caption text-gray-500 font-medium">{card.title}</p>
                <p className={`text-h2 font-bold font-heading mt-1 ${card.valueClass}`}>
                  {card.value.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.iconClass}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          )
        })}
      </div>

      {/*Tabela*/}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

        {/*Filtros*/}
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por pedido ou cliente..."
              value={buscaInput}
              onChange={e => setBuscaInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") setBusca(buscaInput) }}
              onBlur={() => setBusca(buscaInput)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={e => setStatusFiltro(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all cursor-pointer"
          >
            <option value="">Status</option>
            <option value="Aprovado">Concluído</option>
            <option value="Recusado">Falha</option>
            <option value="Reembolsado">Reembolsado</option>
            <option value="Processando">Processando</option>
          </select>

          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
          />

          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
          />

          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all cursor-pointer"
          >
            <option value="">Todos os produtos</option>
            <option value="Eletrônicos">Eletrônicos</option>
            <option value="Vestuário">Vestuário</option>
            <option value="Casa">Casa</option>
            <option value="Esportes">Esportes</option>
            <option value="Beleza">Beleza</option>
            <option value="Automotivo">Automotivo</option>
            <option value="Brinquedos">Brinquedos</option>
            <option value="Móveis">Móveis</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="h-10 px-4 flex items-center gap-2 rounded-lg border border-action text-body-2 font-semibold text-action bg-hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
      </div>

      {/*Conteúdo*/}
      {error ? (
          <div className="p-8 text-center text-error text-body-2">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Pedido ID", "Cliente", "Produto", "Data do Pedido", "Previsão de Entrega", "Valor", "Status"].map(h => (
                    <th key={h} className="px-6 py-4 text-caption font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : pedidos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-body-2 text-gray-400">
                      Nenhum pedido encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  pedidos.map(pedido => (
                    <tr key={pedido.id_pedido} className="hover:bg-gray-50/50 transition-colors duration-150 text-body-2 text-gray-700">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">
                          #{pedido.id_pedido.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{pedido.nome_cliente ?? "-"}</td>
                      <td className="px-6 py-4 text-gray-700">{pedido.nome_produto ?? "-"}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(pedido.data_pedido as unknown as string)}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(pedido.data_prevista_entrega as unknown as string)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(pedido.valor_pedido)}</td>
                      <td className="px-6 py-4"><StatusBadge status={pedido.status_pedido} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/*Paginação*/}
                {!isLoading && !error && total > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
            <span className="text-caption text-gray-500">
              Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} de {total.toLocaleString("pt-BR")} pedidos
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {getPageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-caption text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-caption font-semibold transition-colors ${
                      page === p ? "bg-gray-700 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Pedidos
