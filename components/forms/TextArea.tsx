import type { ChangeEvent } from 'react'
import { FormLabel } from './FormLabel'

type TextareaProps = {
  value: any
  onChange: (_v: string) => void
  label?: string
  required?: boolean
  hint?: string
  span?: boolean
}

export function TextArea({ value, onChange, label, required, hint, span, ...p }: TextareaProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'>) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
      {label && <FormLabel required={required}>{label}</FormLabel>}
      <textarea
        {...p}
        value={value ?? ''}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className="field-input"
        style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}
