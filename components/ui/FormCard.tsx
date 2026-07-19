import React from 'react'

interface FormCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function FormCard({ title, subtitle, children }: FormCardProps) {
  return (
    <div className="form-card fade-in">
      <div className="accent-bar" />
      <div className="space-y-1 mb-8">
        <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
            {subtitle}
          </p>
        )}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
