import { FormLabel } from './FormLabel'
import { useFormField } from './FormField'
import { Select as SelectControl } from '@/components/ui/Select'

interface SelectProps {
  value: any
  onChange: (_value: string) => void
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

/**
 * A form field backed by the shared Radix select, so the dropdown looks the
 * same on every platform and matches the Aerojet design system.
 *
 * The label of a field with `id="x"` is expected to be `x-label` - the
 * wrapper renders it with that id and points the control at it with
 * `aria-labelledby`, which is what gives the trigger its accessible name.
 */
export function Select({
  value, onChange, options, label, required, placeholder, span, id, name, error, touched, onBlur
}: SelectProps) {
  const invalid = !!error && !!touched
  const labelId = id ? `${id}-label` : undefined
  // The label usually lives in the surrounding `FormField`, which owns the
  // `required` flag. Inherit it so the trigger is announced as required.
  const field = useFormField()
  const isRequired = required ?? field.required

  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      {label && <FormLabel required={isRequired} htmlFor={id} id={labelId}>{label}</FormLabel>}
      <SelectControl
        id={id}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        clearable
        required={isRequired}
        invalid={invalid}
        ariaLabelledBy={labelId}
        className="field-input"
        contentClassName="text-base"
        onBlur={onBlur}
      />
    </div>
  )
}
