import React, { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { apiFetch } from "@/services"
import type { ProdutoMetricas } from "@/types"
import { Button } from "@/components/ui"

interface ProductDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleteSuccess: () => void
  product: ProdutoMetricas | null
}

export function ProductDeleteModal({
  isOpen,
  onClose,
  onDeleteSuccess,
  product
}: ProductDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !product) return null

  const handleDelete = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Rota DELETE: Remove o produto pelo ID_PRODUTO
      await apiFetch(`/produtos/${product.id_produto}`, {
        method: "DELETE"
      })
      
      onDeleteSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      setError("Não foi possível excluir este produto. Ele pode estar vinculado a pedidos ativos.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 p-6 space-y-5">
        
        {/* Cabeçalho de Alerta */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-error-50 text-error shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-h3 font-bold text-gray-900">Excluir produto</h3>
            <p className="text-body-2 text-gray-500">
              Esta ação removerá permanentemente o produto do catálogo.
            </p>
          </div>
        </div>

        {/* Mensagem e Nome do Produto */}
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
          <p className="text-caption font-semibold text-gray-400 uppercase tracking-wider">Produto selecionado</p>
          <p className="text-body-1 font-bold text-gray-800 mt-0.5">{product.nome_produto}</p>
          <p className="text-caption text-gray-500 font-mono mt-1">SKU: {product.id_produto}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error-50 border border-error-100 text-caption font-semibold text-error">
            {error}
          </div>
        )}

        <p className="text-body-2 text-gray-600">
          Você tem certeza que deseja excluir este produto? Esta ação **não poderá ser desfeita**.
        </p>

        {/* Rodapé de Ações */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outlined"
            intent="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Button>
          <Button
            intent="error"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Excluindo</span>
              </span>
            ) : (
              "Excluir"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
