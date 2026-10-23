import { createContext, useContext } from 'react'
import { FormLabel } from './FormLabel'

/**
 * Set by `FormField` so a control can pick up the field's `required` flag
 * without every call site having to repeat it.
 *
 * Only `aria-required` is propagated - never the native `required` attribute.
 * A native `required` makes the browser block submission with its own bubble
 * instead of the form's own validation, and it cannot be used on a Radix
 * trigger anyway (Radix copies it onto a hidden bubble `<select>`, which
 * Chrome then refuses to focus).
 */
export const FormFieldContext = createContext<{ required?: boolean }>({})

export function useFormField() {
  return useContext(FormFieldContext)
}

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  span?: boolean
  hint?: string
  error?: string
  touched?: boolean
  /**
   * `id` of the control this field labels. The label is then associated with
   * it (`<label for>`) and the control can point at the label with
   * `aria-labelledby` - a `<button role="combobox">` needs that to have an
   * accessible name.
   */
  htmlFor?: string
}

export function FormField({ label, required, children, span, hint, error, touched, htmlFor }: FormFieldProps) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      <FormLabel required={required} htmlFor={htmlFor} id={htmlFor ? `${htmlFor}-label` : undefined}>{label}</FormLabel>
      <FormFieldContext.Provider value={{ required }}>
        {children}
      </FormFieldContext.Provider>
      {/* Errors only appear once the field has been touched - showing them
          while the user is still filling it in is noise. */}
      {error && touched && <p className="field-error">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
