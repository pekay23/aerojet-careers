import React from 'react'

export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--info-soft)',
        borderLeft: '4px solid var(--info)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        lineHeight: 1.6,
        color: 'var(--foreground)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {children}
      </div>
    </div>
  )
}
