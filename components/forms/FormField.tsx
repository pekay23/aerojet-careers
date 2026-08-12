import { FormLabel } from './FormLabel'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  span?: boolean
  hint?: string
  error?: string
  touched?: boolean
}

export function FormField({ label, required, children, span, hint, error, touched }: FormFieldProps) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      <FormLabel required={required}>{label}</FormLabel>
      {children}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
