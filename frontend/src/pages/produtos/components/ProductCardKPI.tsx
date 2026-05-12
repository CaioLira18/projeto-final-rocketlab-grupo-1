import React from "react"

interface ProductCardKPIProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  iconBg?: string
  iconColor?: string
}

export function ProductCardKPI({
  title,
  value,
  icon: Icon,
  iconBg = "bg-primary-50",
  iconColor = "text-primary"
}: ProductCardKPIProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between transition-all duration-200 hover:shadow-md">
      <div className="space-y-1">
        <span className="text-caption text-gray-500 uppercase font-semibold tracking-wider">
          {title}
        </span>
        <h2 className="text-h2 text-primary font-bold">
          {value}
        </h2>
      </div>
      <div className={`p-3 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}
