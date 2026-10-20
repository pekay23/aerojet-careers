import { FormLabel } from './FormLabel'

interface ComboProps {
  value: any
  onChange: (_value: string) => void
  options: string[]
  label?: string
  required?: boolean
  placeholder?: string
  listId: string
  id?: string
  name?: string
}

export function Combo({
  value, onChange, options, label, required, placeholder, listId, id, name
}: ComboProps) {
  return (
    <div className="field">
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <>
        <input
          id={id}
          name={name}
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
