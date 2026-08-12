import { FormLabel } from './FormLabel'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  span?: boolean
  hint?: string
}

export function FormField({ label, required, children, span, hint }: FormFieldProps) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      <FormLabel required={required}>{label}</FormLabel>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
