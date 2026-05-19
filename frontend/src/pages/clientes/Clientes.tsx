import { useState, useEffect, useCallback } from "react"
import { Users, Search, Download, ChevronLeft, ChevronRight, X, Eye } from "lucide-react"
import { apiFetch } from "@/services"
import { Button } from "@/components/ui"
import { usePermission } from "@/hooks"
import Cliente360Modal from "./components/Cliente360Modal"
import { ToastContainer, useToast } from "@/components/ui/UseToast"

// ── Tipos
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

// ── Constantes ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20

const ESTADOS = [
  "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal",
  "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso Do Sul",
  "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí",
  "Rio De Janeiro", "Rio Grande Do Norte", "Rio Grande Do Sul", "Rondônia",
  "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
]

const GENEROS = ["Masculino", "Feminino", "Não Informado"]
const ORIGENS = ["Web", "App", "Indicação"]

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const [year, month, day] = value.split("-")
  return `${day}/${month}/${year}`
}

function GenderBadge({ g }: { g: string }) {
  const cls =
    g === "Feminino" ? "bg-pink-50 text-pink-600" :
      g === "Masculino" ? "bg-blue-50 text-blue-600" :
        "bg-gray-100 text-gray-500"
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${cls}`}>
      {g === "Feminino" ? "F" : g === "Masculino" ? "M" : "?"}
    </span>
  )
}

function Pagination({
  page, totalPages, total, pageSize, onPage
}: { page: number; totalPages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, page - 1)
      let end = Math.min(totalPages - 1, page + 1)
      if (page <= 3) end = 4
      else if (page >= totalPages - 2) start = totalPages - 3
      if (start > 2) pages.push("...")
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
      <span className="text-caption text-gray-500">
        Mostrando {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} de{" "}
        {total.toLocaleString("pt-BR")} clientes
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-caption text-gray-400 font-bold select-none">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-caption font-semibold transition-colors ${page === p ? "bg-gray-700 text-white border border-gray-700 shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export function Clientes() {
  const { can } = usePermission()
  const podeExportar = can("export.run")
  const podeVer360 = can("clientes.view360")
  const toast = useToast()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros simplificados para busca reativa instantânea
  const [busca, setBusca] = useState("")
  const [id_cliente, setId_cliente] = useState("")
  const [statusGenero, setStatusGenero] = useState("")
  const [estado, setEstado] = useState("")
  const [origem, setOrigem] = useState("")
  const [idadeMin, setIdadeMin] = useState("")
  const [idadeMax, setIdadeMax] = useState("")
  const [semRamal, setSemRamal] = useState(false)

  const filtrosAtivos = [
    busca.trim(),
    id_cliente.trim(),
    statusGenero,
    estado,
    origem,
    idadeMin,
    idadeMax,
    semRamal ? "true" : "",
  ].filter(Boolean).length

  const limparFiltros = () => {
    setBusca("")
    setId_cliente("")
    setStatusGenero("")
    setEstado("")
    setOrigem("")
    setIdadeMin("")
    setIdadeMax("")
    setSemRamal(false)
  }

  // Paginação
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  // KPI
  const [kpiTotal, setKpiTotal] = useState(0)

  // ── Modal 360 ──────────────────────────────────────────────────────────
  const [modal360, setModal360] = useState<{ id: string; nome: string } | null>(null)

  const buildParams = useCallback((extra: Record<string, string> = {}) => {
    const params = new URLSearchParams(extra)
    if (busca.trim()) params.set("busca", busca.trim())
    if (id_cliente) params.set("id_cliente", id_cliente)
    if (statusGenero) params.set("genero", statusGenero)
    if (estado) params.set("estado", estado)
    if (origem) params.set("origem", origem)
    if (idadeMin) params.set("idade_min", idadeMin)
    if (idadeMax) params.set("idade_max", idadeMax)
    if (semRamal) params.set("sem_ramal", "true")
    return params
  }, [busca, id_cliente, statusGenero, estado, origem, idadeMin, idadeMax, semRamal])

  const fetchClientes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = buildParams({
        skip: String((page - 1) * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      })
      const data = await apiFetch<{ clientes: Cliente[]; total: number } | Cliente[]>(
        `/clientes/?${params}`
      )
      const lista = Array.isArray(data) ? data : data.clientes ?? []
      const tot = Array.isArray(data) ? lista.length : data.total ?? lista.length
      setClientes(lista)
      setTotal(tot)
    } catch {
      setError("Erro ao carregar clientes. Verifique se o backend está rodando.")
    } finally {
      setIsLoading(false)
    }
  }, [buildParams, page])

  const fetchKpi = useCallback(async () => {
    try {
      const params = buildParams({ limit: "1" })
      const data = await apiFetch<{ total: number } | Cliente[]>(`/clientes/?${params}`)
      setKpiTotal(Array.isArray(data) ? data.length : data.total ?? 0)
    } catch { }
  }, [buildParams])

  useEffect(() => { fetchKpi() }, [fetchKpi])
  useEffect(() => { fetchClientes() }, [fetchClientes])

  useEffect(() => { setPage(1) }, [busca, id_cliente, statusGenero, estado, origem, idadeMin, idadeMax, semRamal])

  const handleExportCSV = async () => {
    const id = toast.loading("Preparando exportação...")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        `${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/export/clientes`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.update(id, "success", "CSV exportado com sucesso!")
    } catch {
      toast.update(id, "error", "Erro ao exportar CSV.")
    }
  }

  const kpiCards = [
    { title: "Total de Clientes", value: kpiTotal, icon: Users, iconClass: "text-primary bg-primary-50", valueClass: "text-dark" },
  ]

  const TABLE_COLS = [
    "ID do Cliente", "Nome", "E-mail", "Telefone", "Ramal",
    "Gênero", "Idade", "Dt. Nascimento", "Cidade", "Estado", "País", "Origem", "Ações",
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-h1 text-primary font-heading font-bold">Clientes</h1>
        <p className="text-body-2 text-gray-500 mt-1">Visualize e gerencie sua base de clientes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpiCards.map(({ title, value, icon: Icon, iconClass, valueClass }) => (
          <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-caption text-gray-500 font-medium">{title}</p>
              <p className={`text-h2 font-bold font-heading mt-1 ${valueClass}`}>
                {value > 0 ? value.toLocaleString("pt-BR") : "-"}
              </p>
            </div>
            <div className={`p-3 rounded-full ${iconClass}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabela + filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">

        {/* Filtros */}
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">

          {/* Busca Por ID Filtrando Instantaneamente */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por Id"
              value={id_cliente}
              onChange={e => setId_cliente(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
            />
          </div>

          {/* Busca por Nome/E-mail Filtrando Instantaneamente */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
            />
          </div>

          {/* Gênero */}
          <select
            value={statusGenero}
            onChange={e => setStatusGenero(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all cursor-pointer"
          >
            <option value="">Gênero</option>
            {GENEROS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          {/* Estado */}
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all cursor-pointer"
          >
            <option value="">Estado</option>
            {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Origem */}
          <select
            value={origem}
            onChange={e => setOrigem(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all cursor-pointer"
          >
            <option value="">Origem</option>
            {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Faixa de idade */}
          <div className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm">
            <input
              type="number" min={0} max={120} placeholder="Idade de"
              value={idadeMin}
              onChange={e => setIdadeMin(e.target.value)}
              className="w-16 bg-transparent text-center outline-none placeholder-gray-400 text-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-gray-300 text-xs">-</span>
            <input
              type="number" min={0} max={120} placeholder="até"
              value={idadeMax}
              onChange={e => setIdadeMax(e.target.value)}
              className="w-12 bg-transparent text-center outline-none placeholder-gray-400 text-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            {(idadeMin || idadeMax) && (
              <button onClick={() => { setIdadeMin(""); setIdadeMax("") }} className="text-gray-300 hover:text-error transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sem ramal */}
          <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-white cursor-pointer text-sm text-gray-600">
            <input
              type="checkbox"
              checked={semRamal}
              onChange={e => setSemRamal(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Sem ramal
          </label>

          {/* Exportar (apenas roles com permissão export.run) */}
          {podeExportar && (
            <Button variant="outlined" intent="action" leftIcon={<Download />} onClick={handleExportCSV}>
              Exportar CSV
            </Button>
          )}

          {filtrosAtivos > 0 && (
            <button
              onClick={limparFiltros}
              className="text-caption text-gray-400 hover:text-error underline underline-offset-2 self-center cursor-pointer transition-colors duration-150"
            >
              Limpar todos os filtros ({filtrosAtivos})
            </button>
          )}
        </div>

        {/* Conteúdo */}
        {error ? (
          <div className="p-8 text-center text-error text-body-2">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {TABLE_COLS.map(col => (
                    <th key={col} className="px-6 py-4 text-caption font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: TABLE_COLS.length }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_COLS.length} className="px-6 py-12 text-center text-body-2 text-gray-400 space-y-2">
                      <p>Nenhum cliente encontrado para os filtros aplicados.</p>
                      {filtrosAtivos > 0 && (
                        <button
                          onClick={limparFiltros}
                          className="text-sm text-action hover:underline font-semibold cursor-pointer"
                        >
                          Limpar todos os filtros e tentar novamente
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  clientes.map(c => (
                    <tr key={c.id_cliente} className="hover:bg-gray-50/50 transition-colors duration-150 text-body-2 text-gray-700">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.id_cliente}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {c.nome_cliente} {c.sobrenome_cliente}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.email_cliente}</td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{c.telefone_cliente}</td>
                      <td className="px-6 py-4 text-gray-500 text-center">
                        {c.ramal_cliente ?? <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-6 py-4"><GenderBadge g={c.genero_cliente} /></td>
                      <td className="px-6 py-4 text-gray-600 text-center">{c.idade ?? "-"}</td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(c.data_nascimento_cliente)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{c.cidade_cliente}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                          {c.estado_cliente}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{c.pais_cliente}</td>
                      <td className="px-6 py-4">
                        {c.origem_cliente && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-50 text-secondary-700">
                            {c.origem_cliente}
                          </span>
                        )}
                      </td>

                      {/* ── Ações (visão 360 restrita a clientes.view360) ── */}
                      <td className="px-6 py-4">
                        {podeVer360 && (
                          <button
                            onClick={() =>
                              setModal360({
                                id: c.id_cliente,
                                nome: `${c.nome_cliente} ${c.sobrenome_cliente}`.trim(),
                              })
                            }
                            title="Ver visão 360"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-all duration-200 cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && !error && total > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
          />
        )}
      </div>

      {/* Modal 360 */}
      {modal360 && (
        <Cliente360Modal
          clienteId={modal360.id}
          nomeCliente={modal360.nome}
          onClose={() => setModal360(null)}
        />
      )}

      <ToastContainer toasts={toast.toasts} onClose={toast.remove} />
    </div>
  )
}

export default Clientes
