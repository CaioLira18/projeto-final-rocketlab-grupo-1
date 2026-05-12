import React, { useEffect, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { apiFetch } from "@/services"
import type { ProdutoMetricas } from "@/types"
import { Button, Input } from "@/components/ui"

interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSuccess: () => void
  product?: ProdutoMetricas | null
}

const CATEGORIES = [
  "Eletrônicos",
  "Vestuário",
  "Casa",
  "Esportes",
  "Beleza",
  "Automotivo",
  "Brinquedos",
  "Móveis",
  "Outros"
]

export function ProductFormModal({
  isOpen,
  onClose,
  onSaveSuccess,
  product
}: ProductFormModalProps) {
  const isEdit = !!product
  const [sku, setSku] = useState("")
  const [nome, setNome] = useState("")
  const [categoria, setCategoria] = useState("Eletrônicos")
  const [preco, setPreco] = useState(0)
  const [estoque, setEstoque] = useState(0)
  const [fornecedor, setFornecedor] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (product) {
        setSku(product.id_produto || "")
        setNome(product.nome_produto || "")
        setCategoria(product.categoria_produto || "Eletrônicos")
        setPreco(product.preco_produto || 0)
        setEstoque(product.estoque_produto || 0)
        setFornecedor(product.fornecedor_produto || "")
        setAtivo(product.produto_ativo !== false)
      } else {
        setSku("")
        setNome("")
        setCategoria("Eletrônicos")
        setPreco(0)
        setEstoque(0)
        setFornecedor("")
        setAtivo(true)
      }
    }
  }, [isOpen, product])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) {
      setError("O nome do produto é obrigatório.")
      return
    }
    if (preco <= 0) {
      setError("O preço do produto deve ser maior que zero.")
      return
    }
    if (estoque < 0) {
      setError("A quantidade em estoque não pode ser negativa.")
      return
    }
    if (!fornecedor.trim()) {
      setError("O nome do fornecedor é obrigatório.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // monta o payload exatamente correspondente ao ProdutoCreate / ProdutoUpdate do backend
      const payload: Record<string, any> = {
        nome_produto: nome.trim(),
        categoria_produto: categoria,
        preco_produto: preco,
        fornecedor_produto: fornecedor.trim(),
        estoque_produto: estoque,
        produto_ativo: ativo
      }

      if (!isEdit && sku.trim()) {
        payload.id_produto = sku.trim().toUpperCase()
      }

      if (isEdit && product) {
        // PUT /produtos/{produto_id} - Edição
        await apiFetch(`/produtos/${product.id_produto}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        })
      } else {
        // POST /produtos/ - Criação
        await apiFetch("/produtos", {
          method: "POST",
          body: JSON.stringify(payload)
        })
      }

      onSaveSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError(
        isEdit
          ? "Erro ao editar o produto. Verifique as informações e a conexão."
          : "Erro ao cadastrar o produto. Esse SKU de produto já pode estar em uso."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-h3 font-bold text-primary">
            {isEdit ? "Editar produto" : "Novo produto"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5">
          {error && (
            <div className="p-3.5 rounded-lg bg-error-50 border border-error-100 text-caption font-semibold text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SKU (Código identificador) */}
            <Input
              label="Código SKU"
              placeholder={isEdit ? "" : "Ex: PRD-0020 (Opcional)"}
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              disabled={isSubmitting || isEdit} // O SKU é a PK, nunca editável no PUT
              title={isEdit ? "O código do produto não pode ser alterado" : "Código do produto"}
            />

            {/* Categoria */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-body-2-bold text-gray-700 cursor-pointer">
                Categoria
              </label>
              <div className="relative">
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-10 rounded-lg border border-gray-200 hover:border-gray-300 font-sans text-body-2 text-dark bg-white transition-all duration-200 outline-none px-4 focus:border-action focus:ring-2 focus:ring-action-100 appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Nome */}
          <Input
            label="Nome"
            placeholder="Ex: Câmera GoPro Hero 12"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={isSubmitting}
            required
          />

          {/* Fornecedor */}
          <Input
            label="Fornecedor"
            placeholder="Ex: GoPro Inc."
            value={fornecedor}
            onChange={(e) => setFornecedor(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Preço */}
            <Input
              label="Preço"
              type="number"
              min="0.01"
              step="any"
              value={preco || ""}
              onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
              required
            />

            {/* Estoque */}
            <Input
              label="Estoque"
              type="number"
              min="0"
              value={estoque || ""}
              onChange={(e) => setEstoque(parseInt(e.target.value, 10) || 0)}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Switch de Status Ativo (Design Premium) */}
          <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-lg border border-gray-100">
            <div className="space-y-0.5 select-none">
              <span className="text-body-2-bold text-gray-700">Produto Ativo</span>
              <p className="text-caption text-gray-400">Exibir produto nas buscas e operações comerciais</p>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              disabled={isSubmitting}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${ativo ? "bg-primary" : "bg-gray-200"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${ativo ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outlined"
              intent="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              intent="primary"
              disabled={isSubmitting}
              className="min-w-[90px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Salvando</span>
                </span>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
