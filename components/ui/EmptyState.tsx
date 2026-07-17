import React from 'react'

export function EmptyState({ icon = '📋', message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
      <div className="text-5xl opacity-20 grayscale filter">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
        {message}
      </p>
    </div>
  )
}
