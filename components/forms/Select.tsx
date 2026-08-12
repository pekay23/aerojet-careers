import { FormLabel } from './FormLabel'

interface SelectProps {
  value: any
  onChange: (_v: string) => void
  options: (string | { value: string; label: string })[]
  label?: string
  required?: boolean
  placeholder?: string
  span?: boolean
  id?: string
  name?: string
  error?: string
  touched?: boolean
  onBlur?: () => void
}

export function Select({
  value, onChange, options, label, required, placeholder, span, id, name, error, touched, onBlur
}: SelectProps) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <select
        id={id}
        name={name}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className="field-input"
        style={{ cursor: 'pointer' }}
        aria-invalid={!!error && touched}
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
