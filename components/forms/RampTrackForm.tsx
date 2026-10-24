'use client'

import { useState, useRef, useEffect } from 'react'
import { FormCard } from '@/components/ui'
import { Check, CheckCircle2 } from 'lucide-react'
import { RampTrackStep1Schema, RampTrackStep2Schema, RampTrackStep3Schema } from '@/lib/validation/schemas'
import type { RampTrackFormData } from '@/types'
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

const WAEC_NATIONALITIES = [
  'Ghanaian', 'Nigerian', 'Sierra Leonean', 'Liberian', 'Gambian',
]

const COUNTRIES = [
  'Ghana', 'Nigeria', 'Kenya', 'Ethiopia', 'South Africa', 'Egypt',
  'Morocco', 'Tunisia', 'Algeria', 'Tanzania', 'Uganda', 'Rwanda',
  'Cameroon', 'Zambia', 'Zimbabwe', 'Angola', 'Sudan', 'DR Congo',
  'Mali', 'Benin', 'Togo', 'Gambia', 'Sierra Leone', 'Liberia',
  'United Kingdom', 'France', 'Germany', 'India', 'Philippines',
  'United States', 'United Arab Emirates', 'Qatar', 'Other',
]

const WAEC_GRADES = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9']
const HIGHEST_QUALIFICATIONS = ['WAEC/WASSCE', 'OND', 'HND', "Bachelor's Degree", "Master's Degree", 'Other']
const RAMP_ROLES = [
  'Ground Handling Operatives (Trainee)',
  'Aircraft Marshalling Technicians',
  'Aircraft Fuelling Technicians',
  'Cargo & Baggage Handling',
]
const DRIVING_LICENCE_TYPES = ['Light Vehicle (B)', 'Heavy Goods Vehicle (C)', 'Public Service Vehicle (D)', 'Other', 'None']

export default function RampTrackForm() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<RampTrackFormData>({
    first_name: '', last_name: '', email: '', phone: '', nationality: '', country_of_residence: '',
    date_of_birth: '', has_valid_passport: false,
    waec_english_grade: undefined, waec_not_applicable: false,
    highest_qualification: '', qualification_details: '',
    driving_licence_type: 'None', driving_licence_expiry: '',
    preferred_ramp_role: '', shift_availability_confirmed: false,
    night_weekend_holiday_shifts_confirmed: false, physical_fitness_confirmed: false, airside_security_clearance_eligible: false,
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

  const setVal = <K extends keyof RampTrackFormData>(k: K) => (v: RampTrackFormData[K]) => {
    setData(d => ({ ...d, [k]: v }))
  }

  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

  useEffect(() => {
    let isValid = true
    let errors: Record<string, string> = {}

    if (step === 1) {
      const result = RampTrackStep1Schema.safeParse(data)
      isValid = result.success
      if (!result.success && result.error?.issues) {
        for (const issue of result.error.issues) {
          const key = issue.path?.join('.') || 'form'
          errors[key] = issue.message
        }
      }
    } else if (step === 2) {
      const isWaecApplicable = WAEC_NATIONALITIES.includes(data.nationality) && !data.waec_not_applicable
      const result = RampTrackStep2Schema.safeParse(data)
      isValid = result.success
      if (!result.success && result.error?.issues) {
        for (const issue of result.error.issues) {
          const key = issue.path?.join('.') || 'form'
          errors[key] = issue.message
        }
      }
      if (result.success && isWaecApplicable) {
        if (!data.waec_english_grade) {
          isValid = false
          errors.waec_english_grade = 'WAEC English grade is required'
        }
      }
      if (result.success && !isWaecApplicable && !data.waec_not_applicable) {
        isValid = false
        errors.waec_not_applicable = 'Please confirm WAEC is not applicable'
      }
    } else if (step === 3) {
      const result = RampTrackStep3Schema.safeParse(data)
      isValid = result.success
      if (!result.success && result.error?.issues) {
        for (const issue of result.error.issues) {
          const key = issue.path?.join('.') || 'form'
          errors[key] = issue.message
        }
      }
    } else if (step === 4) {
      isValid = !!files.cv && consent && data.motivation.length >= 50
      if (!files.cv) errors.cv = 'CV is required'
      if (!consent) errors.consent = 'Consent is required'
      if (data.motivation.length < 50) errors.motivation = 'Motivation must be at least 50 characters'
    }

    setIsStepValid(isValid)
    setValidationErrors(errors)
  }, [data, step, files.cv, consent])

  const goTo = (n: number) => { setStep(n); setError(''); scrollTop() }

  const markAllTouched = () => {
    const allFields = ['first_name','last_name','email','phone','nationality','country_of_residence','date_of_birth','waec_english_grade','highest_qualification','driving_licence_type','preferred_ramp_role','motivation']
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
    track: 'ramp',
    job_title_applied: `Skilled Training — ${data.preferred_ramp_role}`,
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

      const res = await fetch('/api/applications/ramp-track', {
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
          Thank you for your interest in the Aerojet Skilled Training Programme — Ground Handling & Ramp Track.
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
        {['Personal', 'Education & Licence', 'Track Details', 'Documents'].map((label, i) => {
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
            <FormField label="Nationality" required htmlFor="ramp-nationality" error={validationErrors.nationality} touched={!!touchedFields.nationality}>
              <Select id="ramp-nationality" name="nationality" value={data.nationality} onChange={setVal('nationality')} options={NATIONALITIES} placeholder="Select nationality" error={validationErrors.nationality} touched={!!touchedFields.nationality} onBlur={() => touch('nationality')} />
            </FormField>
            <FormField label="Country of residence" required htmlFor="ramp-country" error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence}>
              <Select id="ramp-country" name="country_of_residence" value={data.country_of_residence} onChange={setVal('country_of_residence')} options={COUNTRIES} placeholder="Select country" error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence} onBlur={() => touch('country_of_residence')} />
            </FormField>
          </FormGrid>
          <FormField label="Date of birth" required hint="You must be at least 18 years old to apply." error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth}>
            <TextInput type="date" id="ramp-dob" name="date_of_birth" value={data.date_of_birth} onChange={setVal('date_of_birth')} min={dobMin} max={dobMax} error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth} onBlur={() => touch('date_of_birth')} />
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

      {/* Step 2: Education & Licence */}
      {step === 2 && (
        <FormCard title="Education & driving licence" subtitle="Ramp track entry requirements: WAEC/WASSCE passes including English. Valid driving licence (light vehicle minimum) required.">
          <FormGrid>
            {WAEC_NATIONALITIES.includes(data.nationality) ? (
              <FormField label="WAEC/WASSCE English grade" required hint="Pass grade required" error={validationErrors.waec_english_grade} touched={!!touchedFields.waec_english_grade}>
                <Select id="ramp-english" name="waec_english_grade" value={data.waec_english_grade || ''} onChange={setVal('waec_english_grade')} options={WAEC_GRADES} placeholder="Select grade" error={validationErrors.waec_english_grade} touched={!!touchedFields.waec_english_grade} onBlur={() => touch('waec_english_grade')} />
              </FormField>
            ) : (
              <FormField label="WAEC/WASSCE not applicable" hint="Select if you do not hold WAEC/WASSCE qualifications (non-West African qualifications)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="ramp-waec-na"
                    checked={data.waec_not_applicable || false}
                    onChange={e => setVal('waec_not_applicable')(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: 'var(--navy)' }}
                  />
                  <label htmlFor="ramp-waec-na" style={{ fontSize: 13, color: 'var(--navy)' }}>
                    I do not hold WAEC/WASSCE qualifications (e.g., A-Levels, IB, BTEC, or other national qualifications)
                  </label>
                </div>
              </FormField>
            )}
            <FormField label="Highest qualification" required htmlFor="ramp-highest-qual" error={validationErrors.highest_qualification} touched={!!touchedFields.highest_qualification}>
              <Select id="ramp-highest-qual" name="highest_qualification" value={data.highest_qualification} onChange={setVal('highest_qualification')} options={HIGHEST_QUALIFICATIONS} placeholder="Select qualification" error={validationErrors.highest_qualification} touched={!!touchedFields.highest_qualification} onBlur={() => touch('highest_qualification')} />
            </FormField>
          </FormGrid>
          <FormField label="Qualification details" hint="Institution, field of study, year of completion">
            <TextArea id="ramp-qual-details" name="qualification_details" value={data.qualification_details} onChange={setVal('qualification_details')} placeholder="e.g., Accra Senior High School, General Arts, 2022" rows={2} />
          </FormField>
          <Divider />
          <FormField label="Driving licence type" required htmlFor="ramp-licence-type" error={validationErrors.driving_licence_type} touched={!!touchedFields.driving_licence_type}>
            <Select id="ramp-licence-type" name="driving_licence_type" value={data.driving_licence_type} onChange={setVal('driving_licence_type')} options={DRIVING_LICENCE_TYPES} placeholder="Select licence type" error={validationErrors.driving_licence_type} touched={!!touchedFields.driving_licence_type} onBlur={() => touch('driving_licence_type')} />
          </FormField>
          <FormField label="Driving licence expiry" hint="Leave blank if not applicable">
            <TextInput type="date" id="ramp-licence-expiry" name="driving_licence_expiry" value={data.driving_licence_expiry} onChange={setVal('driving_licence_expiry')} />
          </FormField>
          <BtnRow onBack={() => goTo(1)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* Step 3: Track Details */}
      {step === 3 && (
        <FormCard title="Ramp track preferences" subtitle="Select your preferred role and confirm the programme requirements.">
          <FormField label="Preferred ramp role" required htmlFor="ramp-role" error={validationErrors.preferred_ramp_role} touched={!!touchedFields.preferred_ramp_role}>
            <Select id="ramp-role" name="preferred_ramp_role" value={data.preferred_ramp_role} onChange={setVal('preferred_ramp_role')} options={RAMP_ROLES} placeholder="Select your preferred role" error={validationErrors.preferred_ramp_role} touched={!!touchedFields.preferred_ramp_role} onBlur={() => touch('preferred_ramp_role')} />
          </FormField>
          <Divider />
          <FormField label="Shift availability & requirements" required>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
              The ramp environment requires shift work including nights, weekends and public holidays. You must be physically fit for an active outdoor airside environment.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <CheckItem label="I confirm I am available for shifts including nights, weekends and public holidays" checked={data.shift_availability_confirmed} onChange={() => setVal('shift_availability_confirmed')(!data.shift_availability_confirmed)} />
              <CheckItem label="I confirm I am available for night, weekend and holiday shifts specifically" checked={data.night_weekend_holiday_shifts_confirmed} onChange={() => setVal('night_weekend_holiday_shifts_confirmed')(!data.night_weekend_holiday_shifts_confirmed)} />
              <CheckItem label="I confirm I have good physical fitness for an active outdoor ramp environment" checked={data.physical_fitness_confirmed} onChange={() => setVal('physical_fitness_confirmed')(!data.physical_fitness_confirmed)} />
              <CheckItem label="I confirm I am eligible for airside security clearance and medical assessment" checked={data.airside_security_clearance_eligible} onChange={() => setVal('airside_security_clearance_eligible')(!data.airside_security_clearance_eligible)} />
            </div>
            {(!data.shift_availability_confirmed || !data.night_weekend_holiday_shifts_confirmed || !data.physical_fitness_confirmed || !data.airside_security_clearance_eligible) && (
              <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4 }}>All four confirmations are required to proceed.</p>
            )}
          </FormField>
          <BtnRow onBack={() => goTo(2)} onNext={next} disabled={!isStepValid} />
        </FormCard>
      )}

      {/* Step 4: Documents */}
      {step === 4 && (
        <FormCard title="Documents & submission" subtitle="Upload your CV and complete your application.">
          <FormField label="CV / Résumé" required>
            <FileZone id="ramp-cv" label="Click to upload your CV" sub="PDF, DOC or DOCX · Max 5 MB" chosen={fileNames.cv} onFile={addFile('cv')} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </FormField>
          <Divider />
          <FormField label="Motivation statement" required error={validationErrors.motivation} touched={!!touchedFields.motivation}>
            <TextArea id="ramp-motivation" name="motivation" value={data.motivation} onChange={setVal('motivation')} placeholder="Why are you interested in a ground handling and ramp career? What draws you to aviation operations? (minimum 50 characters)" rows={4} error={validationErrors.motivation} touched={!!touchedFields.motivation} onBlur={() => touch('motivation')} />
          </FormField>
          <FormField label="How did you hear about us?" htmlFor="ramp-source">
            <Select id="ramp-source" name="source" value={data.source} onChange={setVal('source')} options={['LinkedIn','Colleague referral','Aerojet website','Aviation industry forum','Job board','Social media','Other']} placeholder="Select…" />
          </FormField>

          <div style={{ background: '#eaf3fa', border: '1px solid #b5caeb', padding: '0.875rem 1.1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: 12, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
              By submitting this application you confirm that the information provided is accurate and complete. Your personal data will be processed by Aerojet Aviation solely for evaluating your candidacy. Data is stored securely and will not be shared with third parties without your consent. You may request access to or deletion of your data by contacting <strong>careers@aerojet-aviation.com</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fafbfc', marginBottom: '1rem' }}>
            <input type="checkbox" id="ramp-consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
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