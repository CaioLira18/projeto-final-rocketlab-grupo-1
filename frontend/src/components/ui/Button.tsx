import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

/*exporta usando or*/
export type ButtonVariant = 'filled' | 'outlined' | 'ghost'
export type ButtonSize    = 'sm' | 'md' | 'lg'
export type ButtonIntent  = 'success' | 'action' | 'primary' | 'secondary' | 'error' | 'warning'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  intent?:   ButtonIntent     // opcional, sem intent usa a forma base do design
  leftIcon?: ReactNode
  dropdown?: boolean
  children:  ReactNode
}

/* Tamanhos */
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8  px-3 gap-1.5 text-[13px] font-semibold leading-5 rounded-[6px]',
  md: 'h-10 px-4 gap-2   text-[15px] font-semibold leading-6 rounded-[8px]',
  lg: 'h-12 px-5 gap-2.5 text-[17px] font-semibold leading-6 rounded-[10px]',
}

const iconSizes: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4   h-4',
  lg: 'w-5   h-5',
}

/* FORMA BASE sem intent.
   filled: verde com texto branco
   outlined: transparente com borda e texto brancos
   ghost: branco com texto/ícones escuros
*/
const baseStyles: Record<ButtonVariant, string> = {
  filled:   'bg-success     text-white hover:bg-success-400 active:bg-success-500',
  outlined: 'bg-transparent text-white border border-white   hover:bg-white/10 active:bg-white/15',
  ghost:    'bg-white       text-dark                        hover:bg-gray-100 active:bg-gray-200',
}

/* COM INTENT override opcional de cor para botões temáticos
   exemplo: <Button intent="error"> para deletar
*/
type IntentMap = Record<ButtonIntent, string>

const filledByIntent: IntentMap = {
  success:   'bg-success   text-white hover:bg-success-400   active:bg-success-500',
  action:    'bg-action    text-white hover:bg-action-300    active:bg-action-400',
  primary:   'bg-primary   text-white hover:bg-primary-400   active:bg-primary-500',
  secondary: 'bg-secondary text-white hover:bg-secondary-400 active:bg-secondary-500',
  error:     'bg-error     text-white hover:bg-error-400     active:bg-error-500',
  warning:   'bg-warning   text-white hover:bg-warning-400   active:bg-warning-500',
}

const outlinedByIntent: IntentMap = {
  success:   'bg-transparent border border-success   text-success   hover:bg-success-50   active:bg-success-100',
  action:    'bg-transparent border border-action    text-action    hover:bg-action-50    active:bg-action-100',
  primary:   'bg-transparent border border-primary   text-primary   hover:bg-primary-50   active:bg-primary-100',
  secondary: 'bg-transparent border border-secondary text-secondary hover:bg-secondary-50 active:bg-secondary-100',
  error:     'bg-transparent border border-error     text-error     hover:bg-error-50     active:bg-error-100',
  warning:   'bg-transparent border border-warning   text-warning   hover:bg-warning-50   active:bg-warning-100',
}

const ghostByIntent: IntentMap = {
  success:   'bg-transparent text-success   hover:bg-success-50   active:bg-success-100',
  action:    'bg-transparent text-action    hover:bg-action-50    active:bg-action-100',
  primary:   'bg-transparent text-primary   hover:bg-primary-50   active:bg-primary-100',
  secondary: 'bg-transparent text-secondary hover:bg-secondary-50 active:bg-secondary-100',
  error:     'bg-transparent text-error     hover:bg-error-50     active:bg-error-100',
  warning:   'bg-transparent text-warning   hover:bg-warning-50   active:bg-warning-100',
}

const intentVariants = {
  filled:   filledByIntent,
  outlined: outlinedByIntent,
  ghost:    ghostByIntent,
}

/* Componente */
export function Button({
  variant = 'filled',
  size =    'md',
  intent,
  leftIcon,
  dropdown = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const styles = intent
    ? intentVariants[variant][intent]
    : baseStyles[variant]

  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-sans',
        'transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizes[size],
        styles,
        className,
      )}
      {...props}
    >
      {leftIcon && (
        <span className={cn('shrink-0 [&>svg]:size-full', iconSizes[size])}>
          {leftIcon}
        </span>
      )}

      <span>{children}</span>

      {dropdown && (
        <ChevronDown className={cn('shrink-0', iconSizes[size])} />
      )}
    </button>
  )
}
