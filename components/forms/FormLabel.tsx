export function FormLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field-label">
      {children}
      {required && <span style={{ color: 'var(--blue)', marginLeft: 2 }}>*</span>}
    </label>
  )
}
