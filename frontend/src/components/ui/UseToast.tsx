import { useState, useCallback, useEffect, useRef } from "react"
import { CheckCircle, XCircle, Loader2, X } from "lucide-react"

// ── Tipos ──────────────────────────────────────────────────────────────────
type ToastType = "loading" | "success" | "error"

interface ToastState {
  id: number
  type: ToastType
  message: string
}

// ── Componente de exibição ─────────────────────────────────────────────────
function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastState
  onClose: (id: number) => void
}) {
  const icon =
    toast.type === "loading" ? (
      <Loader2 className="w-4 h-4 animate-spin text-blue-300 shrink-0" />
    ) : toast.type === "success" ? (
      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
    )

  return (
    <div
      className="flex items-center gap-3 border border-white/10 shadow-lg rounded-xl px-4 py-3 min-w-64 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300"
      style={{ backgroundColor: "#1a2744" }}
    >
      {icon}
      <p className="text-sm text-white/90 flex-1">{toast.message}</p>
      {toast.type !== "loading" && (
        <button
          onClick={() => onClose(toast.id)}
          className="text-white/30 hover:text-white/70 transition-colors ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastState[]; onClose: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onClose={onClose} />
      ))}
    </div>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────
let _id = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const add = useCallback((type: ToastType, message: string, duration?: number): number => {
    const id = ++_id
    setToasts(prev => [...prev, { id, type, message }])
    if (type !== "loading" && duration !== 0) {
      const timer = setTimeout(() => remove(id), duration ?? 3500)
      timers.current.set(id, timer)
    }
    return id
  }, [remove])

  const update = useCallback((id: number, type: ToastType, message: string, duration?: number) => {
    const old = timers.current.get(id)
    if (old) { clearTimeout(old); timers.current.delete(id) }

    setToasts(prev => prev.map(t => t.id === id ? { ...t, type, message } : t))

    if (type !== "loading" && duration !== 0) {
      const timer = setTimeout(() => remove(id), duration ?? 3500)
      timers.current.set(id, timer)
    }
  }, [remove])

  useEffect(() => {
    const t = timers.current
    return () => { t.forEach(clearTimeout) }
  }, [])

  return {
    toasts,
    remove,
    loading: (msg: string) => add("loading", msg),
    success: (msg: string, duration?: number) => add("success", msg, duration),
    error:   (msg: string, duration?: number) => add("error",   msg, duration),
    update,
  }
}
