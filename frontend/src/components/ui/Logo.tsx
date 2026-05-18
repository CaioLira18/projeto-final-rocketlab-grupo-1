import { cn } from "@/utils/cn"

type LogoProps = {
  className?: string
  // Quando true, renderiza a versão compacta (apenas o asterisco da marca), ideal para sidebars colapsadas.
  compact?: boolean
}

// Logo da marca "v commerce". Os SVGs vivem em frontend/public/ para paridade com a identidade visual.
// Controle de tamanho via classes utilitárias (h-10, h-8, etc.).
export function Logo({ className, compact = false }: LogoProps) {
  const src = compact ? "/favicon.svg" : "/logo.svg"
  return (
    <img
      src={src}
      alt="v commerce"
      draggable={false}
      className={cn("h-10 w-auto block select-none", className)}
    />
  )
}

export default Logo
