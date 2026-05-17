import { useEffect, useState } from "react"
import {
  Package,
  TrendingUp,
  Star,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react"
import { apiFetch } from "@/services"
import type { ProdutoMetricas } from "@/types"
import { Button } from "@/components/ui"

import { ProductCardKPI } from "./components/ProductCardKPI"
import { ProductFormModal } from "./components/ProductFormModal"
import { ProductDeleteModal } from "./components/ProductDeleteModal"
import ProductDetailsModal from "./components/ProductDetailsModal"

// ----------------- HELPERS DE FORMATAÇÃO -----------------
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "R$ 0,00"
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("pt-BR").format(value)
}

// ----------------- COMPONENTE PRINCIPAL -----------------
export function Produtos() {
  const [produtos, setProdutos] = useState<ProdutoMetricas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para controle de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para Modal de Cadastro / Edição
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProductForForm, setSelectedProductForForm] = useState<ProdutoMetricas | null>(null)

  // Estados para Modal de Exclusão
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<ProdutoMetricas | null>(null)

  // Estados para Modal de Detalhes Avançados
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<ProdutoMetricas | null>(null)

  const loadProdutos = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch<ProdutoMetricas[]>("/produtos/metricas?limit=1000")
      setProdutos(data)
    } catch (err: any) {
      console.error(err)
      setError("Erro ao carregar os dados dos produtos. Verifique se o servidor backend está online.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProdutos()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Filtragem local
  const filteredProdutos = produtos.filter((prod) => {
    const term = searchTerm.toLowerCase()
    return (
      (prod.nome_produto?.toLowerCase() || "").includes(term) ||
      (prod.id_produto?.toLowerCase() || "").includes(term) ||
      (prod.categoria_produto?.toLowerCase() || "").includes(term)
    )
  })

  // Paginação math
  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProdutos = filteredProdutos.slice(startIndex, startIndex + itemsPerPage)

  // Cálculos de KPIs baseados na lista de metricas 
  const totalActiveProducts = produtos.filter(p => p.produto_ativo).length
  const totalQuantitySold = produtos.reduce((acc, p) => acc + (p.quantidade_vendida || 0), 0)
  const reviewedProducts = produtos.filter(p => p.nota_media !== null && p.nota_media !== undefined && p.nota_media > 0)
  const averageRating = reviewedProducts.length > 0
    ? reviewedProducts.reduce((acc, p) => acc + (p.nota_media || 0), 0) / reviewedProducts.length
    : 0.0

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div>
        <h1 className="text-h1 text-primary">Produtos</h1>
        <p className="text-body-2 text-gray-500 mt-1">
          Catálogo e desempenho dos produtos ativos
        </p>
      </div>

      {/* Seção de Carregamento / Erro */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={loadProdutos} />
      ) : (
        <>
          {/* Seção de KPI Cards */}
          <KPICardsSection 
            totalActive={totalActiveProducts} 
            totalSold={totalQuantitySold} 
            avgRating={averageRating} 
          />

          {/* Barra de Filtros e Ação */}
          <FiltersBar 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onNewProduct={() => {
              setSelectedProductForForm(null)
              setIsFormOpen(true)
            }} 
          />

          {/* Tabela de Produtos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredProdutos.length === 0 ? (
              <EmptyState searchTerm={searchTerm} />
            ) : (
              <>
                <ProductTable 
                  products={paginatedProdutos}
                  onViewDetails={(prod) => {
                    setSelectedProductForDetails(prod)
                    setIsDetailsOpen(true)
                  }}
                  onEdit={(prod) => {
                    setSelectedProductForForm(prod)
                    setIsFormOpen(true)
                  }}
                  onDelete={(prod) => {
                    setSelectedProductForDelete(prod)
                    setIsDeleteOpen(true)
                  }}
                />

                {/* Seção de Controle de Paginação */}
                <ProductPagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalFiltered={filteredProdutos.length}
                  startIndex={startIndex}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </>
      )}

      {/* MODAIS DE INTERAÇÃO (CREATE / UPDATE / DELETE / DETAILS) */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaveSuccess={loadProdutos}
        product={selectedProductForForm}
      />

      <ProductDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleteSuccess={loadProdutos}
        product={selectedProductForDelete}
      />

      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        product={selectedProductForDetails}
      />
    </div>
  )
}

// ----------------- SUBCOMPONENTES SUPORTE -----------------

function LoadingState() {
  return (
    <div className="min-h-75 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 text-secondary animate-spin" />
      <p className="text-body-2 text-gray-500">Buscando métricas consolidando dados operacionais e analíticos...</p>
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

function KPICardsSection({ totalActive, totalSold, avgRating }: { totalActive: number; totalSold: number; avgRating: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ProductCardKPI
        title="Produtos Ativos"
        value={formatNumber(totalActive)}
        icon={Package}
        iconBg="bg-primary-50"
        iconColor="text-primary"
      />
      <ProductCardKPI
        title="Vendas Totais"
        value={formatNumber(totalSold)}
        icon={TrendingUp}
        iconBg="bg-success-50"
        iconColor="text-success"
      />
      <ProductCardKPI
        title="Avaliação Média"
        value={`${avgRating.toFixed(1)} ★`}
        icon={Star}
        iconBg="bg-warning-50"
        iconColor="text-warning"
        iconProps={{ fill: "currentColor" }}
      />
    </div>
  )
}

function FiltersBar({ searchTerm, setSearchTerm, onNewProduct }: { searchTerm: string; setSearchTerm: (val: string) => void; onNewProduct: () => void }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="relative flex-1 max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
          <Search className="h-5 w-5" />
        </span>
        <input
          type="text"
          placeholder="Buscar produto..."
          className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200 text-body-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary transition-all duration-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Button
        size="lg"
        intent="primary"
        leftIcon={<Plus className="h-5 w-5" />}
        onClick={onNewProduct}
      >
        Novo produto
      </Button>
    </div>
  )
}

function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="p-12 text-center text-gray-400 font-medium">
      Nenhum produto encontrado para "{searchTerm}"
    </div>
  )
}

interface ProductTableProps {
  products: ProdutoMetricas[]
  onViewDetails: (prod: ProdutoMetricas) => void
  onEdit: (prod: ProdutoMetricas) => void
  onDelete: (prod: ProdutoMetricas) => void
}

function ProductTable({ products, onViewDetails, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">SKU</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Produto</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Categoria</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Preço</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Estoque</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Vendas</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider">Aval.</th>
            <th className="px-6 py-4 text-caption text-gray-400 font-semibold uppercase tracking-wider text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((prod) => (
            <tr
              key={prod.id_produto}
              className="hover:bg-gray-50/50 transition-colors duration-150 text-body-2 text-gray-700">
              <td className="px-6 py-4 font-semibold text-gray-500 font-mono tracking-tight">{prod.id_produto}</td>
              <td className="px-6 py-4 font-semibold text-gray-900">{prod.nome_produto}</td>
              <td className="px-6 py-4 text-gray-500">{prod.categoria_produto}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(prod.preco_produto)}</td>
              <td className="px-6 py-4 font-medium text-gray-700">{prod.estoque_produto ?? 0}</td>
              <td className="px-6 py-4 font-medium text-gray-700">{formatNumber(prod.quantidade_vendida || 0)}</td>
              <td className="px-6 py-4">
                {prod.nota_media !== null && prod.nota_media !== undefined ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-gray-800">
                    {prod.nota_media.toFixed(1)}
                    <Star className="h-4 w-4 fill-warning text-warning shrink-0" />
                  </span>
                ) : (
                  <span className="text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-md text-caption">N/A</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <Button size="sm" variant="ghost" intent="primary" title="Visualizar Detalhes" onClick={() => onViewDetails(prod)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" intent="primary" title="Editar Produto" onClick={() => onEdit(prod)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" intent="error" title="Excluir Produto" onClick={() => onDelete(prod)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ProductPaginationProps {
  currentPage: number
  totalPages: number
  totalFiltered: number
  startIndex: number
  itemsPerPage: number
  onPageChange: (page: number) => void
}

function ProductPagination({
  currentPage,
  totalPages,
  totalFiltered,
  startIndex,
  itemsPerPage,
  onPageChange
}: ProductPaginationProps) {
  // para os botões, truncado com reticencias
  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
      }

      if (start > 2) {
        pages.push("...")
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  return (
    <div className="bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      <div className="text-caption text-gray-500 font-medium order-2 sm:order-1">
        Mostrando <span className="font-semibold text-gray-700">{startIndex + 1}</span> a{" "}
        <span className="font-semibold text-gray-700">
          {Math.min(startIndex + itemsPerPage, totalFiltered)}
        </span>{" "}
        de <span className="font-semibold text-gray-700">{totalFiltered}</span> produtos
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          title="Página Anterior"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 font-bold select-none text-caption flex items-center justify-center"
              >
                ...
              </span>
            )
          }
          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              className={`h-8 w-8 rounded-lg text-caption font-semibold transition-all duration-150 cursor-pointer ${currentPage === page
                ? "bg-primary text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-100 active:bg-gray-200"
                }`}
            >
              {page}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          title="Próxima Página"
        >
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  )
}

export default Produtos
