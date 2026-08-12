# Validation

The portal uses **Zod** for schema validation across client forms and server API
routes. Validation is centralized in `lib/validation/schemas.ts`.

## Schema locations

| Schema | Used by | Purpose |
| --- | --- | --- |
| `RegistrationSchema` | `app/register/page.tsx` | General candidate registration |
| `WizardStep1Schema` | `components/forms/ApplicationForm.tsx` | Personal details step |
| `WizardStep2Schema` | `components/forms/ApplicationForm.tsx` | Licences & qualifications step |
| `WizardStep3Schema` | `components/forms/ApplicationForm.tsx` | Work experience step |
| `WizardStep4Schema` | `components/forms/ApplicationForm.tsx` | Compensation & availability step |
| `ApplicationSchema` | `app/api/applications/route.ts` | Full application submission |
| Various admin schemas | `app/api/admin/*/route.ts` | Admin mutations |

## Client-side vs server-side

- **Client-side:** React `useEffect` re-validates on every field change using
  `safeParse()`. Errors are stored in `fieldErrors` state and only shown after a
  field is `touched` (blur or submit attempt).
- **Server-side:** API routes re-validate with the same Zod schemas before
  writing to the database. Server errors return `400` with a generic message.

## Touched-state pattern

Form components (`TextInput`, `Select`, `TextArea`, `FormField`) accept an
optional `touched?: boolean` prop. Validation feedback (red borders, error text)
only renders when `touched && error` is true.

```tsx
<FormField label="Email" error={errors.email} touched={!!touchedFields.email}>
  <TextInput error={errors.email} touched={!!touchedFields.email} onBlur={() => touch('email')} />
</FormField>
```

This prevents showing errors before the user has interacted with a field.

## Error message conventions

Validation messages are friendly and actionable:

- Text fields: "Input your first name", "Enter your last name"
- Email: "Enter a valid email"
- Selects: "Select your nationality"
- Arrays: "Select at least one type rating"

Avoid generic messages like "Required" or "Invalid input".

## Refinements

Custom refinements handle cross-field validation:

```ts
.superRefine((data, ctx) => {
  if (data.role_start_date && data.role_end_date && data.role_end_date < data.role_start_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date must be after start date', path: ['role_end_date'] })
  }
})
```
