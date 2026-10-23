export function FormLabel({
  children,
  required,
  htmlFor,
  id,
}: {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
  id?: string
}) {
  return (
    <label className="field-label" htmlFor={htmlFor} id={id}>
      {children}
      {required && <span style={{ color: 'var(--blue)', marginLeft: 2 }}>*</span>}
    </label>
  )
}
