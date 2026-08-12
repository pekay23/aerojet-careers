import type { ChangeEvent } from 'react'

interface TextInputProps {
  value: any
  onChange: (_v: string) => void
  id?: string
  name?: string
  autoComplete?: string
  error?: string
  touched?: boolean
}

export function TextInput({ value, onChange, id, name, autoComplete, error, touched, ...p }: TextInputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <input
      id={id}
      name={name}
      autoComplete={autoComplete}
      {...p}
      value={value ?? ''}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="field-input"
      aria-invalid={!!error && touched}
    />
  )
}