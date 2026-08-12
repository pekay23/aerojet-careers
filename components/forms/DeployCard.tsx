import type { ComponentType } from 'react'

interface DeployCardProps {
  id: string
  Icon: ComponentType<{ size?: number | string; strokeWidth?: number | string }>
  iconColor: string
  title: string
  sub: string
  active: boolean
  onClick: () => void
}

const COLORS: Record<string, { border: string; bg: string }> = {
  yes:   { border: 'var(--success)', bg: '#f0faf5' },
  ghana: { border: '#b8860b',        bg: '#fefce8' },
  no:    { border: 'var(--error)',   bg: '#fef2f2' },
}

export function DeployCard({ id, Icon, iconColor, title, sub, active, onClick }: DeployCardProps) {
  const colors = COLORS[id] || COLORS.yes
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: `2px solid ${active ? colors.border : 'var(--border)'}`,
        borderRadius: 8, padding: '1rem 0.875rem', cursor: 'pointer',
        textAlign: 'center', background: active ? colors.bg : '#fafbfc',
        transition: 'border-color 0.15s, background 0.15s', width: '100%',
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: iconColor }} aria-hidden="true">
        <Icon size={20} strokeWidth={2.5} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', lineHeight: 1.3 }}>{title}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block', lineHeight: 1.4 }}>{sub}</span>
    </button>
  )
}
