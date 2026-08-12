interface RadioItemProps {
  label: string
  value: string
  current: any
  onChange: (_v: string) => void
}

export function RadioItem({ label, value, current, onChange }: RadioItemProps) {
  const active = current === value
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
      padding: '0.6rem 0.875rem', border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: 8, background: active ? '#eaf3fa' : '#fafbfc',
      flex: 1, minWidth: 130, transition: 'all 0.15s',
    }}>
      <input
        type="radio"
        value={value}
        checked={active}
        onChange={() => onChange(value)}
        style={{ accentColor: 'var(--blue)', flexShrink: 0 }}
      />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  )
}
