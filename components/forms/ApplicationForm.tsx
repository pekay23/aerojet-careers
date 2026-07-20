'use client'
import { useState, useRef, useEffect } from 'react'
import { z } from 'zod'
import { FormCard } from '@/components/ui'
import {
  Check,
  Circle,
  X,
  Upload,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

type FD = Record<string, any>

interface Props { jobId: string; jobTitle: string }

// ── Option data ────────────────────────────────────────────────────────────
// Consistent demonym list (was a mix of demonyms + country names).
const NATIONALITIES = [
  'Ethiopian', 'Kenyan', 'Ghanaian', 'Nigerian', 'Senegalese', 'Ivorian',
  'South African', 'Egyptian', 'Moroccan', 'Tunisian', 'Algerian', 'Tanzanian',
  'Ugandan', 'Rwandan', 'Cameroonian', 'Zambian', 'Zimbabwean', 'Angolan',
  'Sudanese', 'Congolese', 'Malian', 'Beninese', 'Togolese', 'Gambian',
  'Sierra Leonean', 'Liberian', 'British', 'French', 'German', 'Indian',
  'Filipino', 'American', 'Other',
]

const COUNTRIES = [
  'Ethiopia', 'Kenya', 'Ghana', 'Nigeria', 'Senegal', "Côte d'Ivoire",
  'South Africa', 'Egypt', 'Morocco', 'Tunisia', 'Algeria', 'Tanzania',
  'Uganda', 'Rwanda', 'Cameroon', 'Zambia', 'Zimbabwe', 'Angola', 'Sudan',
  'DR Congo', 'Mali', 'Benin', 'Togo', 'Gambia', 'Sierra Leone', 'Liberia',
  'United Kingdom', 'France', 'Germany', 'India', 'Philippines',
  'United States', 'United Arab Emirates', 'Qatar', 'Other',
]

// ── Validation Schemas ─────────────────────────────────────────────────────
const isAdult = (dob: string) => {
  if (!dob) return false
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return d <= cutoff
}

const Step1Schema = z.object({
  first_name: z.string().min(2, 'Required'),
  last_name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(8, 'Required'),
  nationality: z.string().min(1, 'Selection required'),
  country_of_residence: z.string().min(1, 'Selection required'),
  date_of_birth: z.string().min(1, 'Required').refine(isAdult, 'Must be at least 18'),
  deployment_pref: z.enum(['fully_flexible', 'ghana_only', 'not_available']),
})

const Step2Schema = z.object({
  licence_type: z.string().min(1, 'Selection required'),
  type_ratings: z.array(z.string()).min(1, 'Select at least one'),
})

const Step3Schema = z
  .object({
    current_employer: z.string().min(2, 'Required'),
    total_years_exp: z.string().min(1, 'Selection required'),
    role_start_date: z.string().optional(),
    role_end_date: z.string().optional(),
  })
  .refine(
    (d) => !d.role_start_date || !d.role_end_date || d.role_end_date >= d.role_start_date,
    { message: 'End date must be after start date', path: ['role_end_date'] }
  )

const Step4Schema = z
  .object({
    payment_preference: z.string().min(1, 'Selection required'),
    expected_min_usd: z.union([z.number(), z.nan()]).optional(),
    expected_target_usd: z.union([z.number(), z.nan()]).optional(),
  })
  .refine(
    (d) =>
      !d.expected_min_usd ||
      !d.expected_target_usd ||
      Number(d.expected_target_usd) >= Number(d.expected_min_usd),
    { message: 'Target must be at least the minimum', path: ['expected_target_usd'] }
  )

// ── Tiny shared input components ──────────────────────────────────────────
const L = ({ children, req }: { children: string; req?: boolean }) => (
  <label className="field-label">{children}{req && <span style={{ color: 'var(--blue)', marginLeft: 2 }}>*</span>}</label>
)

const I = ({ value, onChange, ...p }: { value: any; onChange: (v: string) => void; [k: string]: any }) => (
  <input
    {...p}
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    className="field-input"
  />
)

const Sel = ({ value, onChange, options, placeholder }: {
  value: any; onChange: (v: string) => void
  options: (string | { value: string; label: string })[]
  placeholder?: string
}) => (
  <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
    <option value="">{placeholder ?? 'Select…'}</option>
    {options.map(o => {
      const v = typeof o === 'string' ? o : o.value
      const l = typeof o === 'string' ? o : o.label
      return <option key={v} value={v}>{l}</option>
    })}
  </select>
)

// Searchable select via native datalist (typeahead + free entry).
const Combo = ({ value, onChange, options, placeholder, listId }: {
  value: any; onChange: (v: string) => void; options: string[]; placeholder?: string; listId: string
}) => (
  <>
    <input
      list={listId}
      className="field-input"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'Type to search…'}
      autoComplete="off"
    />
    <datalist id={listId}>
      {options.map(o => <option key={o} value={o} />)}
    </datalist>
  </>
)

const TA = ({ value, onChange, ...p }: { value: any; onChange: (v: string) => void; [k: string]: any }) => (
  <textarea {...p} value={value ?? ''} onChange={e => onChange(e.target.value)}
    className="field-input" style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
)

// Two-up on wider screens, single column on phones (auto-fit collapse).
const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>{children}</div>
)


const Field = ({ label, required, children, span, hint }: { label: string; required?: boolean; children: React.ReactNode; span?: boolean; hint?: string }) => (
  <div className="field" style={span ? { gridColumn: '1 / -1' } : {}}>
    <L req={required}>{label}</L>
    {children}
    {hint && <p className="field-hint">{hint}</p>}
  </div>
)

const CheckItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
    padding: '0.6rem 0.875rem', border: `1px solid ${checked ? 'var(--blue)' : 'var(--border)'}`,
    borderRadius: 8, background: checked ? '#eaf3fa' : '#fafbfc', transition: 'border-color 0.15s, background 0.15s',
  }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0, cursor: 'pointer' }} />
    <span style={{ fontSize: 13, color: 'var(--navy)' }}>{label}</span>
  </label>
)

const RadioItem = ({ label, value, current, onChange }: { label: string; value: string; current: any; onChange: (v: string) => void }) => {
  const active = current === value
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
      padding: '0.6rem 0.875rem', border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
      borderRadius: 8, background: active ? '#eaf3fa' : '#fafbfc',
      flex: 1, minWidth: 130, transition: 'all 0.15s',
    }}>
      <input type="radio" value={value} checked={active} onChange={() => onChange(value)}
        style={{ accentColor: 'var(--blue)', flexShrink: 0 }} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  )
}

const DeployCard = ({ id, Icon, iconColor, title, sub, active, onClick }: any) => {
  const colors: Record<string, { border: string; bg: string }> = {
    yes:   { border: 'var(--success)', bg: '#f0faf5' },
    ghana: { border: '#b8860b',        bg: '#fefce8' },
    no:    { border: 'var(--error)',   bg: '#fef2f2' },
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        border: `2px solid ${active ? colors[id].border : 'var(--border)'}`,
        borderRadius: 8, padding: '1rem 0.875rem', cursor: 'pointer',
        textAlign: 'center', background: active ? colors[id].bg : '#fafbfc',
        transition: 'border-color 0.15s, background 0.15s', width: '100%',
      }}
    >
      <span style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, color: iconColor }} aria-hidden="true">
        <Icon size={20} strokeWidth={2.5} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', display: 'block', lineHeight: 1.3 }}>{title}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'block', lineHeight: 1.4 }}>{sub}</span>
    </button>
  )
}

const FileZone = ({ label, sub, chosen, onFile, accept }: { label: string; sub: string; chosen?: string; onFile: (f: File) => void; accept?: string }) => (
  <div style={{
    position: 'relative', border: `2px dashed ${chosen ? 'var(--success)' : 'var(--border)'}`,
    borderRadius: 8, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
    background: '#fafbfc', transition: 'border-color 0.15s',
  }}
    onMouseOver={e => { if (!chosen) (e.currentTarget.style.borderColor = 'var(--blue)') }}
    onMouseOut={e => { if (!chosen) (e.currentTarget.style.borderColor = 'var(--border)') }}
  >
    <input type="file" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f as File) }}
      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: chosen ? 'var(--success)' : 'var(--muted)' }} aria-hidden="true">
      {chosen ? <FileCheck2 size={22} /> : <Upload size={22} />}
    </div>
    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub}</div>
    {chosen && (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--success)', marginTop: 6 }}>
        <Check size={14} /> {chosen}
      </div>
    )}
  </div>
)

const Divider = () => <div style={{ borderTop: '1px solid var(--border)', margin: '1.25rem 0' }} />

const BtnRow = ({ onBack, onNext, disabled, nextLabel = 'Continue', nextStyle }: any) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: 12 }}>
    {onBack ? (
      <button onClick={onBack} className="btn btn-outline"><ArrowLeft size={16} /> Back</button>
    ) : <span />}
    <button onClick={onNext} className="btn btn-blue" disabled={disabled} style={nextStyle ? nextStyle : (disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {})}>
      {nextLabel} <ArrowRight size={16} />
    </button>
  </div>
)

// ── Main component ─────────────────────────────────────────────────────────
export default function ApplicationForm({ jobId, jobTitle }: Props) {
  const [step,       setStep]       = useState(1)
  const [data,       setData]       = useState<FD>({ type_ratings: [], certifications: [], work_types: [], current_benefits: [] })
  const [files,      setFiles]      = useState<Record<string, File>>({})
  const [fileNames,  setFileNames]  = useState<Record<string, string>>({})
  const [consent,    setConsent]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [refCode,    setRefCode]    = useState('')
  const [error,      setError]      = useState('')
  const [isStepValid, setIsStepValid] = useState(false)
  const topRef = useRef<HTMLDivElement>(null)

  const set = (k: string) => (v: any) => setData(d => ({ ...d, [k]: v }))
  const toggleArr = (k: string, v: string) => setData(d => {
    const arr: string[] = d[k] || []
    return { ...d, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }
  })
  const has = (k: string, v: string) => !!(data[k] || []).includes(v)
  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

  useEffect(() => {
    let result: { success: boolean } | undefined
    if (step === 1) result = Step1Schema.safeParse(data)
    else if (step === 2) result = Step2Schema.safeParse(data)
    else if (step === 3) result = Step3Schema.safeParse(data)
    else if (step === 4) result = Step4Schema.safeParse(data)
    else if (step === 5) result = { success: !!files.cv && consent }
    else result = { success: true }

    setIsStepValid(!!result?.success)
  }, [data, step, files.cv, consent])

  const STEPS = ['Personal', 'Qualifications', 'Experience', 'Compensation', 'Documents']

  const goTo = (n: number) => { setStep(n); setError(''); scrollTop() }

  const next = () => {
    if (!isStepValid) return
    goTo(step + 1)
  }

  const addFile = (key: string) => (f: File) => {
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return }
    setFiles(p => ({ ...p, [key]: f }))
    setFileNames(p => ({ ...p, [key]: `${f.name} (${Math.round(f.size / 1024)} KB)` }))
    setError('')
  }

  // Fold "Other (specify)" free-text values into the stored fields.
  const buildPayload = () => {
    const workTypes: string[] = (data.work_types || []).filter((w: string) => w !== 'other')
    if ((data.work_types || []).includes('other') && data.work_types_other) workTypes.push(data.work_types_other)

    return {
      ...data,
      job_id: jobId,
      job_title_applied: jobTitle,
      type_ratings:     data.type_ratings     || [],
      certifications:   data.certifications    || [],
      work_types:       workTypes,
      current_benefits: data.current_benefits  || [],
      highest_qualification:
        data.highest_qualification === 'Other'
          ? (data.highest_qualification_other || 'Other')
          : data.highest_qualification,
      deployment_arrangement:
        data.deployment_arrangement === 'Other'
          ? (data.deployment_arrangement_other || 'Other')
          : data.deployment_arrangement,
      source: data.source === 'Other' ? (data.source_other || 'Other') : data.source,
    }
  }

  const submit = async () => {
    if (!isStepValid) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || `Server error (${res.status}). Please contact support if this persists.`)
      }

      const appId   = result.data?.id
      const appRef  = result.data?.ref_code

      if (!appId) {
        throw new Error('Database Error: Application ID was not returned. Your data may not have been saved.')
      }

      for (const [key, file] of Object.entries(files)) {
        const fd = new FormData()
        fd.append('file',           file)
        fd.append('application_id', appId)
        fd.append('document_type',  key === 'cv' ? 'cv' : key === 'licence' ? 'licence_scan' : 'passport_scan')
        await fetch('/api/upload', { method: 'POST', body: fd })
      }

      setRefCode(appRef || '')
      setSubmitted(true)
      scrollTop()
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Date-of-birth bounds: 18–70 years old.
  const today = new Date()
  const dobMax = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().slice(0, 10)
  const dobMin = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

  const licenceExpired = !!data.licence_expiry && new Date(data.licence_expiry) < new Date(new Date().toDateString())

  if (submitted) {
    return (
      <div ref={topRef} className="card fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
          <CheckCircle2 size={30} strokeWidth={2.5} />
        </div>
        <div className="accent-bar" style={{ margin: '0 auto 1.25rem' }} />
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Application received</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 420, margin: '0 auto 1.75rem' }}>
          Thank you for your interest in Aerojet Aviation. We have received your application and will review it carefully.
          A confirmation email has been sent to you. Our team will be in touch within <strong>5–7 business days</strong>.
        </p>
        <div style={{ display: 'inline-block', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: 8, fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy)', fontSize: 14, marginBottom: '1.25rem' }}>
          {refCode}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          Questions? Email{' '}
          <a href="mailto:careers@aerojet-aviation.com" style={{ color: 'var(--blue)' }}>careers@aerojet-aviation.com</a>
          {' '}with your reference number.
        </p>
      </div>
    )
  }

  return (
    <div ref={topRef}>
      {/* Progress bar — completed steps are keyboard-focusable buttons that
          jump back; the current/future steps are inert. Step counter above
          keeps orientation clear on small screens. */}
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Step {step} of {STEPS.length} — {STEPS[step - 1]}
      </p>
      <nav aria-label="Application progress" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2rem' }}>
        {STEPS.map((label, i) => {
          const n = i + 1; const done = n < step; const active = n === step
          const dot = (
            <span style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              background: done ? 'var(--blue)' : active ? 'var(--navy)' : 'white',
              border: `2px solid ${done ? 'var(--blue)' : active ? 'var(--navy)' : 'var(--border)'}`,
              color: (done || active) ? 'white' : 'var(--muted)',
              position: 'relative', zIndex: 2,
            }}>
              {done ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : n}
            </span>
          )
          const labelEl = (
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', color: active ? 'var(--navy)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          )
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              {done ? (
                <button
                  type="button"
                  onClick={() => goTo(n)}
                  aria-label={`Go back to step ${n}: ${label}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  {dot}{labelEl}
                </button>
              ) : (
                <div aria-current={active ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {dot}{labelEl}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <div aria-hidden="true" style={{ flex: 1, height: 2, background: done ? 'var(--blue)' : 'var(--border)', margin: '0 4px', marginTop: 13, zIndex: 1 }} />
              )}
            </div>
          )
        })}
      </nav>


      {error && (
        <div role="alert" aria-live="polite" style={{ background: 'var(--error-bg)', border: '1px solid #f0bfbf', color: 'var(--error)', padding: '0.75rem 1rem', borderRadius: 8, fontSize: 13, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* ── Step 1: Personal ─────────────────────────────────────────────── */}
      {step === 1 && (
        <FormCard title="Personal details" subtitle="Tell us who you are and how to reach you. All information is treated in strict confidence.">
          <Grid>
            <Field label="First name" required><I name="given-name" autoComplete="given-name" value={data.first_name} onChange={set('first_name')} placeholder="Given name" /></Field>
            <Field label="Last name" required><I name="family-name" autoComplete="family-name" value={data.last_name} onChange={set('last_name')} placeholder="Family name" /></Field>
            <Field label="Email address" required><I type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} value={data.email} onChange={set('email')} placeholder="you@example.com" /></Field>
            <Field label="Phone / WhatsApp" required hint="Include your international dialing code, e.g. +233…">
              <I type="tel" name="tel" autoComplete="tel" inputMode="tel" value={data.phone} onChange={set('phone')} placeholder="+233 20 000 0000" />
            </Field>

            <Field label="Nationality" required>
              <Combo listId="nationality-list" value={data.nationality} onChange={set('nationality')} options={NATIONALITIES} placeholder="Type or select nationality" />
            </Field>
            <Field label="Country of residence" required>
              <Combo listId="country-list" value={data.country_of_residence} onChange={set('country_of_residence')} options={COUNTRIES} placeholder="Type or select country" />
            </Field>
          </Grid>
          <Field label="Date of birth" required hint="You must be at least 18 years old to apply.">
            <I type="date" value={data.date_of_birth} onChange={set('date_of_birth')} min={dobMin} max={dobMax} />
          </Field>
          <Field label="Valid passport?">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <RadioItem label="Yes — valid passport held" value="true"  current={String(data.has_valid_passport)} onChange={v => set('has_valid_passport')(v === 'true')} />
              <RadioItem label="No — applying / expired"   value="false" current={String(data.has_valid_passport)} onChange={v => set('has_valid_passport')(v === 'true')} />
            </div>
          </Field>
          <Field label="Willingness to be deployed" required>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
              Aerojet deploys engineers to our own hub locations and partner operator stations. Deployments may be in Africa or internationally.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <DeployCard id="yes"   Icon={Check}  iconColor="var(--success)" title="Yes — fully flexible" sub="Willing to deploy to any Aerojet hub"       active={data.deployment_pref === 'fully_flexible'} onClick={() => set('deployment_pref')('fully_flexible')} />
              <DeployCard id="ghana" Icon={Circle} iconColor="#b8860b"        title="Ghana only"           sub="Deployment within Ghana at this time only"   active={data.deployment_pref === 'ghana_only'}      onClick={() => set('deployment_pref')('ghana_only')} />
              <DeployCard id="no"    Icon={X}      iconColor="var(--error)"   title="Not at this time"     sub="Not available for deployment away from base" active={data.deployment_pref === 'not_available'}   onClick={() => set('deployment_pref')('not_available')} />
            </div>
          </Field>
          <Field label="Availability for deployment">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <RadioItem label="Immediately available" value="immediately"   current={data.availability} onChange={set('availability')} />
              <RadioItem label="Subject to notice"     value="notice_period" current={data.availability} onChange={set('availability')} />
              <RadioItem label="Open to discussion"    value="discuss"       current={data.availability} onChange={set('availability')} />
            </div>
          </Field>
          <BtnRow onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* ── Step 2: Qualifications ───────────────────────────────────────── */}
      {step === 2 && (
        <FormCard title="Licences & qualifications" subtitle="Provide your current regulatory licences and authorisations.">
          <Grid>
            <Field label="Primary licence" required>
              <Sel value={data.licence_type} onChange={set('licence_type')} options={['EASA Part-66 B1.1','EASA Part-66 B2','EASA Part-66 B1.1 + B2','ECAA (Ethiopian)','KCAA (Kenya)','GCAA (Ghana)','NCAA (Nigeria)','FAA A&P','Other']} />
            </Field>
            <Field label="Licence number"><I value={data.licence_number} onChange={set('licence_number')} placeholder="e.g. EASA.B1.ET.XXXXX" /></Field>
            <Field label="Issuing authority"><I value={data.issuing_authority} onChange={set('issuing_authority')} placeholder="e.g. ECAA, KCAA, EASA" /></Field>
            <Field label="Licence expiry">
              <I type="date" value={data.licence_expiry} onChange={set('licence_expiry')} />
              {licenceExpired && <p className="field-hint" style={{ color: 'var(--warning)' }}>This licence appears to have expired.</p>}
            </Field>
          </Grid>
          <Divider />
          <Field label="Current type ratings" required>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Select all that are currently on your licence.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['B737NG','Boeing 737 NG (B1 — CFM56)'],['B737MAX','Boeing 737 MAX (B1 — CFM LEAP)'],['E190','Embraer E190 / E195'],['A320','Airbus A320 family'],['B787','Boeing 787'],['B777','Boeing 777'],['other','Other (specify below)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('type_ratings', v)} onChange={() => toggleArr('type_ratings', v)} />
              ))}
            </div>
          </Field>
          {has('type_ratings', 'other') && (
            <Field label="Other type ratings">
              <I value={data.other_type_ratings} onChange={set('other_type_ratings')} placeholder="List any additional types not shown above" />
            </Field>
          )}
          <Divider />
          <Field label="Additional certifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['HF','Human Factors (EASA-recognised)'],['DG','Dangerous Goods Awareness'],['SMS','Safety Management Systems (SMS)'],['Avionics','Avionics / B2 authorisation'],['NDT','NDT (Non-Destructive Testing)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('certifications', v)} onChange={() => toggleArr('certifications', v)} />
              ))}
            </div>
          </Field>
          <Field label="Highest educational qualification">
            <Sel value={data.highest_qualification} onChange={set('highest_qualification')} options={['AMT Certificate','Diploma in Aero Engineering','BSc Aero/Mech Engineering','BSc Electrical Engineering',"Master's Degree",'Other']} />
          </Field>
          {data.highest_qualification === 'Other' && (
            <Field label="Please specify your qualification">
              <I value={data.highest_qualification_other} onChange={set('highest_qualification_other')} placeholder="Your highest qualification" />
            </Field>
          )}
          <BtnRow onBack={() => goTo(1)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* ── Step 3: Experience ───────────────────────────────────────────── */}
      {step === 3 && (
        <FormCard title="Work experience" subtitle="Tell us about your current and previous roles.">
          <Grid>
            <Field label="Current employer" required><I value={data.current_employer} onChange={set('current_employer')} placeholder="e.g. Ethiopian Airlines" /></Field>
            <Field label="Job title / grade"><I value={data.job_title} onChange={set('job_title')} placeholder="e.g. Senior LAE" /></Field>
            <Field label="Start date (current role)"><I type="date" value={data.role_start_date} onChange={set('role_start_date')} max={new Date().toISOString().slice(0, 10)} /></Field>
            <Field label="End date (if applicable)">
              <I type="date" value={data.role_end_date} onChange={set('role_end_date')} min={data.role_start_date || undefined} />
              {data.role_start_date && data.role_end_date && data.role_end_date < data.role_start_date && (
                <p className="field-hint" style={{ color: 'var(--error)' }}>End date must be after the start date.</p>
              )}
            </Field>
          </Grid>
          <Field label="Total years of experience" required>
            <Sel value={data.total_years_exp} onChange={set('total_years_exp')} options={['Less than 3 years','3–5 years','6–8 years','9–12 years','13–15 years','15+ years']} />
          </Field>
          <Field label="Types of work">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[['transit','Line maintenance — transit'],['acheck','A-checks / scheduled'],['aog','AOG / defect rectification'],['heavymaint','Heavy maintenance / C-checks'],['other','Other (specify below)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('work_types', v)} onChange={() => toggleArr('work_types', v)} />
              ))}
            </div>
          </Field>
          {has('work_types', 'other') && (
            <Field label="Please specify other work types">
              <I value={data.work_types_other} onChange={set('work_types_other')} placeholder="Describe other maintenance work" />
            </Field>
          )}
          <Field label="Outstation experience">
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              <RadioItem label="Extensive" value="extensive" current={data.outstation_exp} onChange={set('outstation_exp')} />
              <RadioItem label="Some"      value="some"      current={data.outstation_exp} onChange={set('outstation_exp')} />
              <RadioItem label="Base only" value="none"      current={data.outstation_exp} onChange={set('outstation_exp')} />
            </div>
          </Field>
           <Field label="Why are you interested in Aerojet? (Motivation)">
            <TA value={data.motivation} onChange={set('motivation')} placeholder="What draws you to this role and our company?" />
          </Field>
          <BtnRow onBack={() => goTo(2)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* ── Step 4: Compensation ─────────────────────────────────────────── */}
      {step === 4 && (
        <FormCard title="Compensation & availability" subtitle="Ensuring we offer you a competitive package. All data is confidential.">
          <Grid>
            <Field label="Current salary (monthly)"><I type="number" min={0} step={100} value={data.current_salary} onChange={v => set('current_salary')(v === '' ? undefined : Number(v))} placeholder="0" /></Field>
            <Field label="Currency"><Sel value={data.current_salary_currency || 'USD'} onChange={set('current_salary_currency')} options={['USD','ETB','KES','GHS','ZAR','NGN','EUR']} /></Field>
          </Grid>
          <Field label="Current benefits">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {[['housing','Housing allowance'],['medical','Medical insurance'],['flights','Staff travel'],['pension','Pension fund']].map(([v,l]) => (
                  <CheckItem key={v} label={l} checked={has('current_benefits', v)} onChange={() => toggleArr('current_benefits', v)} />
                ))}
            </div>
          </Field>
          <Divider />
          <Grid>
             <Field label="Salary expectation (Min USD)"><I type="number" min={0} step={100} value={data.expected_min_usd} onChange={v => set('expected_min_usd')(v === '' ? undefined : Number(v))} placeholder="0" /></Field>
             <Field label="Salary expectation (Target USD)">
               <I type="number" min={0} step={100} value={data.expected_target_usd} onChange={v => set('expected_target_usd')(v === '' ? undefined : Number(v))} placeholder="0" />
               {data.expected_min_usd && data.expected_target_usd && Number(data.expected_target_usd) < Number(data.expected_min_usd) && (
                 <p className="field-hint" style={{ color: 'var(--error)' }}>Target should be at least the minimum.</p>
               )}
             </Field>
          </Grid>
          <Field label="Preferred payment arrangement" required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[['usd_home','USD — paid to home country account'],['local_home','Local currency — paid to home account']].map(([v,l]) => (
                <RadioItem key={v} label={l} value={v} current={data.payment_preference} onChange={set('payment_preference')} />
              ))}
            </div>
          </Field>
          <Field label="Deployment arrangement preference">
             <Sel value={data.deployment_arrangement} onChange={set('deployment_arrangement')} options={['Rotation (4 on / 2 off)','Rotation (6 on / 3 off)','Open to discussion','Other']} />
          </Field>
          {data.deployment_arrangement === 'Other' && (
            <Field label="Please specify arrangement">
              <I value={data.deployment_arrangement_other} onChange={set('deployment_arrangement_other')} placeholder="Preferred rotation / arrangement" />
            </Field>
          )}
          <BtnRow onBack={() => goTo(3)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* ── Step 5: Documents ───────────────────────────────── */}
      {step === 5 && (
        <FormCard title="Documents & submission" subtitle="Upload your CV and supporting documents to finish your application.">
          <Field label="CV / Résumé" required>
            <FileZone label="Click to upload your CV" sub="PDF, DOC or DOCX · Max 5 MB" chosen={fileNames.cv} onFile={addFile('cv')} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </Field>
          <Grid>
            <Field label="Licence scan (Part-66 / etc.)">
                <FileZone label="Upload licence scan" sub="PDF or Image · Max 5 MB" chosen={fileNames.licence} onFile={addFile('licence')} accept=".pdf,image/*" />
            </Field>
            <Field label="Passport scan">
                <FileZone label="Upload passport data page" sub="PDF or Image · Max 5 MB" chosen={fileNames.passport} onFile={addFile('passport')} accept=".pdf,image/*" />
            </Field>
          </Grid>

          <Divider />

          <Field label="How did you hear about us?">
             <Sel value={data.source} onChange={set('source')} options={['LinkedIn','Ethiopian internal network','Kenya Airways network','Colleague referral','Aerojet website','Job board','Other']} />
          </Field>
          {data.source === 'Other' && (
            <Field label="Please specify">
              <I value={data.source_other} onChange={set('source_other')} placeholder="How did you hear about us?" />
            </Field>
          )}

          <div style={{ background: '#eaf3fa', border: '1px solid #b5caeb', padding: '0.875rem 1.1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: 12, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
              By submitting this application you confirm that the information provided is accurate and complete. Your personal data will be processed by Aerojet Aviation solely for evaluating your candidacy. Data is stored securely and will not be shared with third parties without your consent. You may request access to or deletion of your data by contacting <strong>careers@aerojet-aviation.com</strong>.
            </p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fafbfc', marginBottom: '1rem' }}>
            <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              I confirm the above and consent to my data being processed for recruitment purposes <span style={{ color: 'var(--blue)' }}>*</span>
            </span>
          </label>

          <BtnRow
            onBack={() => goTo(4)}
            onNext={submit}
            disabled={!isStepValid || submitting}
            nextLabel={submitting ? 'Submitting…' : 'Submit application'}
          />
        </FormCard>
      )}
    </div>
  )
}
