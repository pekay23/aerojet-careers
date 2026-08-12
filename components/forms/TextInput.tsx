import type { ChangeEvent } from 'react'

interface TextInputProps {
  value: any
  onChange: (_v: string) => void
}

export function TextInput({ value, onChange, ...p }: TextInputProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <input
      {...p}
      value={value ?? ''}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="field-input"
    />
  )
}