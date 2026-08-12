import { FormLabel } from './FormLabel'

interface SelectProps {
  value: any
  onChange: (_v: string) => void
  options: (string | { value: string; label: string })[]
  label?: string
  required?: boolean
  placeholder?: string
  span?: boolean
}

export function Select({
  value, onChange, options, label, required, placeholder, span
}: SelectProps) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        className="field-input"
        style={{ cursor: 'pointer' }}
      >
        <option value="">{placeholder ?? 'Select…'}</option>
        {options.map(o => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return <option key={v} value={v}>{l}</option>
        })}
      </select>
    </div>
  )
}
