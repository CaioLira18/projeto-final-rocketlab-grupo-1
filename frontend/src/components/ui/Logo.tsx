import { cn } from "@/utils/cn"

type LogoProps = {
  className?: string
}

/**
 * Logo da marca "v commerce".
 * O SVG vive em `frontend/public/logo.svg` (exportado do Figma) para
 * garantir paridade pixel-perfect com a identidade visual.
 *
 * Controle de tamanho via classes utilitárias (`h-10`, `h-8`, etc.).
 */
export function Logo({ className }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt="v commerce"
      draggable={false}
      className={cn("h-10 w-auto block select-none", className)}
    />
  )
}

export default Logo
