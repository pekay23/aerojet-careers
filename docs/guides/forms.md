# Forms

The portal's form system was refactored from a monolithic `ApplicationForm.tsx`
into 13 reusable, typed components in `components/forms/`.

## Component catalog

| Component | Path | Purpose |
| --- | --- | --- |
| `FormField` | `FormField.tsx` | Wrapper with label, hint, error, touched state |
| `FormLabel` | `FormLabel.tsx` | Consistent label with required asterisk |
| `FormGrid` | `FormGrid.tsx` | Responsive 2-column grid for form fields |
| `TextInput` | `TextInput.tsx` | Text input with touched-state `aria-invalid` |
| `TextArea` | `TextArea.tsx` | Textarea with touched-state `aria-invalid` |
| `Select` | `Select.tsx` | Select dropdown with touched-state `aria-invalid` |
| `CheckItem` | `CheckItem.tsx` | Checkbox item |
| `RadioItem` | `RadioItem.tsx` | Radio button item |
| `Combo` | `Combo.tsx` | Combined input component |
| `DeployCard` | `DeployCard.tsx` | Deployment preference card |
| `FileZone` | `FileZone.tsx` | File upload zone with drag-and-drop |
| `BtnRow` | `BtnRow.tsx` | Button row (Back / Save Draft / Continue) |
| `Divider` | `Divider.tsx` | Visual section divider |

All components are exported from `components/forms/index.ts`.

## Touched-state validation

Validation feedback only appears after user interaction:

1. User focuses a field → `onBlur` marks it `touched`
2. On submit attempt, all visible fields are marked `touched`
3. `aria-invalid` and red borders appear only when `touched && error`

```tsx
const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
const touch = (k: string) => setTouchedFields(p => ({ ...p, [k]: true }))

<TextInput
  error={validationErrors.email}
  touched={!!touchedFields.email}
  onBlur={() => touch('email')}
/>
```

## Multi-step wizard

`ApplicationForm.tsx` implements a 5-step wizard:

1. Personal details
2. Licences & qualifications
3. Work experience
4. Compensation & availability
5. Documents & submission

Each step has its own Zod schema (`WizardStep1Schema` … `WizardStep4Schema`)
validated on change. Navigation is gated by `isStepValid`.

## Draft saving

Form state is persisted to `localStorage` with the key
`aerojet-draft-${jobId}`. Auto-save triggers on step change and field updates.
A "Resume draft?" banner appears if a draft exists on load.

## Validation messages

Error messages are friendly and field-specific:

- Text inputs: "Input your first name", "Enter your email"
- Selects: "Select your nationality"
- Arrays: "Select at least one type rating"

Inline error text is removed from the UI. Errors are communicated via:
1. Red border on the input (`aria-invalid`)
2. Server-level error banners (API failures only)
