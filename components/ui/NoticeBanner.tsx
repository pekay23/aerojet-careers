import React from 'react'
import { Info } from 'lucide-react'

export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="note"
      style={{
        background: 'var(--info-soft)',
        borderLeft: '4px solid var(--info)',
        borderRadius: 'var(--r-lg)',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: 'var(--foreground)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <Info
          size={18}
          aria-hidden="true"
          style={{ color: 'var(--info)', flexShrink: 0, marginTop: '0.1rem' }}
        />
        <div>{children}</div>
      </div>
    </div>
  )
}
