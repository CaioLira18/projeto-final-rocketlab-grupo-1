import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/utils/cn"

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

// Input de busca padrao das telas de listagem: icone de lupa a esquerda e
// debounce no commit. O valor digitado fica em estado local e so propaga
// para o pai apos `debounceMs` sem novas teclas (default 300ms), reduzindo
// requests sem perder a sensacao de reatividade.
export function SearchInput({
  value,
  onChange,
  debounceMs = 300,
  placeholder = "Buscar...",
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value)
  // Espelha o ultimo `value` recebido por prop. Permite distinguir "o pai
  // mudou o valor" (ex.: clique em Limpar filtros) de "o usuario digitou".
  const propsValueRef = useRef(value)

  // Sincroniza local quando o pai muda o valor por fora (limpar filtros, etc.).
  useEffect(() => {
    if (value !== propsValueRef.current) {
      propsValueRef.current = value
      setLocal(value)
    }
  }, [value])

  // Debounce: emite `onChange` apos a pausa, mas so se o local divergir do
  // ultimo valor vindo do pai. A cleanup cancela timeout pendente quando
  // local muda de novo (incluindo quando o pai reseta), evitando que uma
  // busca antiga sobreponha um clear externo.
  useEffect(() => {
    if (local === propsValueRef.current) return
    const t = setTimeout(() => onChange(local), debounceMs)
    return () => clearTimeout(t)
  }, [local, debounceMs, onChange])

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full h-10 pl-9 pr-4 rounded-lg border border-gray-200 text-body-2 text-dark bg-white outline-none focus:border-action focus:ring-2 focus:ring-action-100 transition-all"
      />
    </div>
  )
}
