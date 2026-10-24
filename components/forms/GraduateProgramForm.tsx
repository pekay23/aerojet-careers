'use client'

import { useState, useRef, useEffect } from 'react'
import { FormCard } from '@/components/ui'
import { Check, CheckCircle2 } from 'lucide-react'
import { GraduateProgramSchema } from '@/lib/validation/schemas'
import type { GraduateProgramFormData } from '@/types'
import {
  FormField, FormGrid, TextInput, TextArea, Select,
  CheckItem, RadioItem, FileZone, Divider, BtnRow,
} from '@/components/forms'

const NATIONALITIES = [
  'Ghanaian', 'Nigerian', 'Kenyan', 'Ethiopian', 'South African', 'Egyptian',
  'Moroccan', 'Tunisian', 'Algerian', 'Tanzanian', 'Ugandan', 'Rwandan',
  'Cameroonian', 'Zambian', 'Zimbabwean', 'Angolan', 'Sudanese', 'Congolese',
  'Malian', 'Beninese', 'Togolese', 'Gambian', 'Sierra Leonean', 'Liberian',
  'British', 'French', 'German', 'Indian', 'Filipino', 'American', 'Other',
]

const COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'Ethiopia', 'South Africa', 'Egypt',
  'Morocco', 'Tunisia', 'Algeria', 'Tanzania', 'Uganda', 'Rwanda',
  'Cameroon', 'Zambia', 'Zimbabwe', 'Angola', 'Sudan', 'DR Congo',
  'Mali', 'Benin', 'Togo', 'Gambia', 'Sierra Leone', 'Liberia',
  'United Kingdom', 'France', 'Germany', 'India', 'Philippines',
  'United States', 'United Arab Emirates', 'Qatar', 'Other',
]

const PROGRAM_AREAS = [
  'Engineering',
  'Information Technology',
  'Operations',
  'Human Resources',
  'Customer Support',
  'Sales',
  'Logistics',
  'Quality',
]

export default function GraduateProgramForm() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<GraduateProgramFormData>({
    first_name: '', last_name: '', email: '', phone: '', nationality: '', country_of_residence: '',
    date_of_birth: '', has_valid_passport: false,
    degree: '', university: '', graduation_year: new Date().getFullYear(), grade_gpa: '',
    preferred_areas: [], internships_attachments: '',
    motivation: '', source: '',
  })
  const [files, setFiles] = useState<Record<string, File>>({})
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [refCode, setRefCode] = useState('')
  const [error, setError] = useState('')
  const [isStepValid, setIsStepValid] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const topRef = useRef<HTMLDivElement>(null)

  const touch = (k: string) => setTouchedFields(p => ({ ...p, [k]: true }))

  const setVal = <K extends keyof GraduateProgramFormData>(k: K) => (v: GraduateProgramFormData[K]) => {
    setData(d => ({ ...d, [k]: v }))
  }

  const toggleArea = (area: string) => setData(d => {
    const arr: string[] = d.preferred_areas || []
    return { ...d, preferred_areas: arr.includes(area) ? arr.filter(x => x !== area) : [...arr, area] }
  })

  const hasArea = (area: string) => (data.preferred_areas || []).includes(area)

  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

  useEffect(() => {
    let result: { success: boolean } | undefined
    if (step === 1) result = GraduateProgramSchema.pick({
      first_name: true, last_name: true, email: true, phone: true,
      nationality: true, country_of_residence: true, date_of_birth: true, has_valid_passport: true,
    }).safeParse(data)
    else if (step === 2) result = GraduateProgramSchema.pick({
      degree: true, university: true, graduation_year: true, grade_gpa: true,
    }).safeParse(data)
    else if (step === 3) result = GraduateProgramSchema.pick({
      preferred_areas: true, internships_attachments: true,
    }).safeParse(data)
    else if (step === 4) result = { success: !!files.cv && consent && data.motivation.length >= 50 }
    else result = { success: true }

    setIsStepValid(!!result?.success)

    if (result && !result.success && (result as any).error?.issues) {
      const errors: Record<string, string> = {}
      for (const issue of (result as any).error.issues) {
        const key = issue.path?.join('.') || 'form'
        errors[key] = issue.message
      }
      setValidationErrors(errors)
    } else {
      setValidationErrors({})
    }
  }, [data, step, files.cv, consent])

  const goTo = (n: number) => { setStep(n); setError(''); scrollTop() }

  const markAllTouched = () => {
    const allFields = ['first_name','last_name','email','phone','nationality','country_of_residence','date_of_birth','degree','university','graduation_year','preferred_areas','motivation']
    setTouchedFields(Object.fromEntries(allFields.map(k => [k, true])))
  }

  const next = () => {
    if (!isStepValid) { markAllTouched(); return }
    goTo(step + 1)
  }

  const addFile = (key: string) => (f: File) => {
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return }
    setFiles(p => ({ ...p, [key]: f }))
    setFileNames(p => ({ ...p, [key]: `${f.name} (${Math.round(f.size / 1024)} KB)` }))
    setError('')
  }

  const buildPayload = () => ({
    ...data,
    track: 'graduate',
    preferred_areas: data.preferred_areas,
    job_title_applied: 'Graduate Program',
  })

  const submit = async () => {
    if (!isStepValid) { markAllTouched(); return }
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(buildPayload()).forEach(([k, v]) => {
        if (v !== undefined && v !== null && k !== 'cv_file') {
          fd.append(k, Array.isArray(v) ? JSON.stringify(v) : String(v))
        }
      })
      if (files.cv) fd.append('cv_file', files.cv)

      const res = await fetch('/api/applications/graduate-program', {
        method: 'POST',
        body: fd,
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || `Server error (${res.status}). Please contact support if this persists.`)
      }

      setRefCode(result.data?.ref_code || '')
      setSubmitted(true)
      scrollTop()
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date()
  const dobMax = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().slice(0, 10)
  const dobMin = new Date(today.getFullYear() - 70, today.getMonth(), today.getDate()).toISOString().slice(0, 10)

  if (submitted) {
    return (
      <div ref={topRef} className="card fade-in" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'white' }}>
          <CheckCircle2 size={30} strokeWidth={2.5} />
        </div>
        <div className="accent-bar" style={{ margin: '0 auto 1.25rem' }} />
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Application received</h2>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: 420, margin: '0 auto 1.75rem' }}>
          Thank you for your interest in the Aerojet Graduate Program.
          We have received your application and will review it carefully.
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
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
        Step {step} of 4
      </p>
      <nav aria-label="Application progress" style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2rem' }}>
        {['Personal', 'Education', 'Preferences', 'Documents'].map((label, i) => {
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
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? 'var(--navy)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          )
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : 'none' }}>
              {done ? (
                <button type="button" onClick={() => goTo(n)} aria-label={`Go back to step ${n}: ${label}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                  {dot}{labelEl}
                </button>
              ) : (
                <div aria-current={active ? 'step' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {dot}{labelEl}
                </div>
              )}
              {i < 3 && (
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

      {/* Step 1: Personal */}
      {step === 1 && (
        <FormCard title="Personal details" subtitle="Tell us who you are and how to reach you. All information is treated in strict confidence.">
          <FormGrid>
            <FormField label="First name" required error={validationErrors.first_name} touched={!!touchedFields.first_name}>
              <TextInput name="given-name" autoComplete="given-name" value={data.first_name} onChange={setVal('first_name')} placeholder="Given name" error={validationErrors.first_name} touched={!!touchedFields.first_name} onBlur={() => touch('first_name')} />
            </FormField>
            <FormField label="Last name" required error={validationErrors.last_name} touched={!!touchedFields.last_name}>
              <TextInput name="family-name" autoComplete="family-name" value={data.last_name} onChange={setVal('last_name')} placeholder="Family name" error={validationErrors.last_name} touched={!!touchedFields.last_name} onBlur={() => touch('last_name')} />
            </FormField>
            <FormField label="Email address" required error={validationErrors.email} touched={!!touchedFields.email}>
              <TextInput type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} value={data.email} onChange={setVal('email')} placeholder="you@example.com" error={validationErrors.email} touched={!!touchedFields.email} onBlur={() => touch('email')} />
            </FormField>
            <FormField label="Phone / WhatsApp" required hint="Include your international dialing code, e.g. +233…" error={validationErrors.phone} touched={!!touchedFields.phone}>
              <TextInput type="tel" name="tel" autoComplete="tel" inputMode="tel" value={data.phone} onChange={setVal('phone')} placeholder="+233 20 000 0000" error={validationErrors.phone} touched={!!touchedFields.phone} onBlur={() => touch('phone')} />
            </FormField>
            <FormField label="Nationality" required htmlFor="grad-nationality" error={validationErrors.nationality} touched={!!touchedFields.nationality}>
              <Select id="grad-nationality" name="nationality" value={data.nationality} onChange={setVal('nationality')} options={NATIONALITIES} placeholder="Select nationality" error={validationErrors.nationality} touched={!!touchedFields.nationality} onBlur={() => touch('nationality')} />
            </FormField>
            <FormField label="Country of residence" required htmlFor="grad-country" error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence}>
              <Select id="grad-country" name="country_of_residence" value={data.country_of_residence} onChange={setVal('country_of_residence')} options={COUNTRIES} placeholder="Select country" error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence} onBlur={() => touch('country_of_residence')} />
            </FormField>
          </FormGrid>
          <FormField label="Date of birth" required hint="You must be at least 18 years old to apply." error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth}>
            <TextInput type="date" id="grad-dob" name="date_of_birth" value={data.date_of_birth} onChange={setVal('date_of_birth')} min={dobMin} max={dobMax} error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth} onBlur={() => touch('date_of_birth')} />
          </FormField>
          <FormField label="Valid passport?">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <RadioItem label="Yes — valid passport held" value="true"  current={String(data.has_valid_passport)} onChange={v => setVal('has_valid_passport')(v === 'true')} />
              <RadioItem label="No — applying / expired"   value="false" current={String(data.has_valid_passport)} onChange={v => setVal('has_valid_passport')(v === 'true')} />
            </div>
          </FormField>
          <BtnRow onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* Step 2: Education */}
      {step === 2 && (
        <FormCard title="Education" subtitle="Tell us about your degree. The Graduate Programme is intended for candidates with less than 3 years of work experience.">
          <FormGrid>
            <FormField label="Degree title" required error={validationErrors.degree} touched={!!touchedFields.degree}>
              <TextInput id="grad-degree" name="degree" value={data.degree} onChange={setVal('degree')} placeholder="e.g., BSc Mechanical Engineering" error={validationErrors.degree} touched={!!touchedFields.degree} onBlur={() => touch('degree')} />
            </FormField>
            <FormField label="University" required error={validationErrors.university} touched={!!touchedFields.university}>
              <TextInput id="grad-university" name="university" value={data.university} onChange={setVal('university')} placeholder="e.g., Kwame Nkrumah University of Science and Technology" error={validationErrors.university} touched={!!touchedFields.university} onBlur={() => touch('university')} />
            </FormField>
            <FormField label="Graduation year" required htmlFor="grad-year" error={validationErrors.graduation_year} touched={!!touchedFields.graduation_year}>
              <Select id="grad-year" name="graduation_year" value={String(data.graduation_year)} onChange={v => setVal('graduation_year')(Number(v))} options={Array.from({length: 15}, (_, i) => String(new Date().getFullYear() - i))} placeholder="Select year" error={validationErrors.graduation_year} touched={!!touchedFields.graduation_year} onBlur={() => touch('graduation_year')} />
            </FormField>
            <FormField label="Grade / GPA" hint="e.g., First Class, 3.8/4.0, Distinction, 2:1">
              <TextInput id="grad-grade" name="grade_gpa" value={data.grade_gpa} onChange={setVal('grade_gpa')} placeholder="Your final grade or GPA" />
            </FormField>
          </FormGrid>
          <BtnRow onBack={() => goTo(1)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <FormCard title="Programme preferences" subtitle="Select the areas you're most interested in. As positions become available, graduate opportunities may open in these areas.">
          <FormField label="Preferred programme areas" required error={validationErrors.preferred_areas} touched={!!touchedFields.preferred_areas}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Select all that apply (minimum 1)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {PROGRAM_AREAS.map(area => (
                <CheckItem
                  key={area}
                  label={area}
                  checked={hasArea(area)}
                  onChange={() => toggleArea(area)}
                />
              ))}
            </div>
            {data.preferred_areas.length === 0 && touchedFields.preferred_areas && (
              <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>Select at least one programme area.</p>
            )}
          </FormField>
          <Divider />
          <FormField label="Internships, industrial attachments & projects" hint="Describe any relevant internships, attachments, research projects, or training that supports your application">
            <TextArea id="grad-internships" name="internships_attachments" value={data.internships_attachments} onChange={setVal('internships_attachments')} placeholder="e.g., 6-month industrial attachment at Ghana Civil Aviation Authority, 2023; Final year project on aircraft maintenance scheduling..." rows={3} />
          </FormField>
          <BtnRow onBack={() => goTo(2)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* Step 4: Documents */}
      {step === 4 && (
        <FormCard title="Documents & submission" subtitle="Upload your CV and complete your application.">
          <FormField label="CV / Résumé" required>
            <FileZone id="grad-cv" label="Click to upload your CV" sub="PDF, DOC or DOCX · Max 5 MB" chosen={fileNames.cv} onFile={addFile('cv')} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </FormField>
          <Divider />
          <FormField label="Motivation statement" required error={validationErrors.motivation} touched={!!touchedFields.motivation}>
            <TextArea id="grad-motivation" name="motivation" value={data.motivation} onChange={setVal('motivation')} placeholder="Why do you want to join the Aerojet Graduate Programme? What draws you to aviation and which programme area interests you most? (minimum 50 characters)" rows={4} error={validationErrors.motivation} touched={!!touchedFields.motivation} onBlur={() => touch('motivation')} />
          </FormField>
          <FormField label="How did you hear about us?" htmlFor="grad-source">
            <Select id="grad-source" name="source" value={data.source} onChange={setVal('source')} options={['LinkedIn','Colleague referral','Aerojet website','University careers service','Aviation industry forum','Job board','Social media','Other']} placeholder="Select…" />
          </FormField>

          <div style={{ background: '#eaf3fa', border: '1px solid #b5caeb', padding: '0.875rem 1.1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: 12, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
              By submitting this application you confirm that the information provided is accurate and complete. Your personal data will be processed by Aerojet Aviation solely for evaluating your candidacy. Data is stored securely and will not be shared with third parties without your consent. You may request access to or deletion of your data by contacting <strong>careers@aerojet-aviation.com</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fafbfc', marginBottom: '1rem' }}>
            <input type="checkbox" id="grad-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              I confirm the above and consent to my data being processed for recruitment purposes <span style={{ color: 'var(--blue)' }}>*</span>
            </span>
          </div>

          <BtnRow
            onBack={() => goTo(3)}
            onNext={submit}
            disabled={!isStepValid || submitting}
            nextLabel={submitting ? 'Submitting…' : 'Submit application'}
          />
        </FormCard>
      )}
    </div>
  )
}