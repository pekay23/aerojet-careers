import { FormLabel } from './FormLabel'

interface ComboProps {
  value: any
  onChange: (_v: string) => void
  options: string[]
  label?: string
  required?: boolean
  placeholder?: string
  listId: string
}

export function Combo({
  value, onChange, options, label, required, placeholder, listId
}: ComboProps) {
  return (
    <div className="field">
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <>
        <input
          list={listId}
          className="field-input"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'Type to search…'}
          autoComplete="off"
        />
        <datalist id={listId}>
          {options.map(o => <option key={o} value={o} />)}
        </datalist>
      </>
    </div>
  )
}
