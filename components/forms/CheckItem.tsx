interface CheckItemProps {
  label: string
  checked: boolean
  onChange: (_checked: boolean) => void
}

export function CheckItem({ label, checked, onChange }: CheckItemProps) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      padding: '0.6rem 0.875rem', border: `1px solid ${checked ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: 8, background: checked ? '#eaf3fa' : '#fafbfc', transition: 'border-color 0.15s, background 0.15s',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 13, color: 'var(--navy)' }}>{label}</span>
    </label>
  )
}
