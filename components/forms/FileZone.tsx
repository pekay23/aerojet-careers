interface FileZoneProps {
  label: string
  sub: string
  chosen?: string
  onFile: (_file: File) => void
  accept?: string
  id?: string
}

export function FileZone({ label, sub, chosen, onFile, accept, id }: FileZoneProps) {
  return (
    <div style={{
      position: 'relative', border: `2px dashed ${chosen ? 'var(--success)' : 'var(--border)'}`,
      borderRadius: 8, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
      background: '#fafbfc', transition: 'border-color 0.15s',
    }}
      onMouseOver={e => { if (!chosen) (e.currentTarget.style.borderColor = 'var(--blue)') }}
      onMouseOut={e => { if (!chosen) (e.currentTarget.style.borderColor = 'var(--border)') }}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f as File) }}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
        aria-label={label}
      />
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: chosen ? 'var(--success)' : 'var(--muted)' }} aria-hidden="true">
        {chosen ? <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>{chosen}</span> : <span style={{ fontSize: 13, color: 'var(--muted)' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 3 }}>{label}</div>
      {!chosen && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>}
      {chosen && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--success)', marginTop: 6 }}>
          ✓ {chosen}
        </div>
      )}
    </div>
  )
}
