import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/utils/cn"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  labelAction?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, labelAction, className, type = "text", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {(label || labelAction) && (
          <div className="flex justify-between items-center select-none">
            {label && (
              <label
                htmlFor={inputId}
                className="text-body-2-bold text-gray-700 cursor-pointer"
              >
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-gray-400 pointer-events-none flex items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 rounded-lg border font-sans text-body-2 text-dark bg-white transition-all duration-200 outline-none",
              "border-gray-200 hover:border-gray-300",
              "focus:border-action focus:ring-2 focus:ring-action-100",
              leftIcon ? "pl-10 pr-4" : "px-4",
              error && "border-error hover:border-error focus:border-error focus:ring-error-100",
              "disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <span className="text-caption font-semibold text-error animate-fade-in">
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
