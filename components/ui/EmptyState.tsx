import React from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'

/**
 * Empty-state placeholder. Uses a Lucide icon (SVG) rather than an emoji so it
 * renders consistently across platforms and matches the icon system.
 */
export function EmptyState({
  icon: Icon = Inbox,
  message,
}: {
  icon?: LucideIcon
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
      <Icon className="h-10 w-10 text-slate-300" aria-hidden="true" strokeWidth={1.5} />
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
        {message}
      </p>
    </div>
  )
}
