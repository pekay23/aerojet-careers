'use client'
import { useState, useRef, useEffect } from 'react'
import { FormCard } from '@/components/ui'
import { Check, Circle, X, CheckCircle2 } from 'lucide-react'
import {
  WizardStep1Schema,
  WizardStep2Schema,
  WizardStep3Schema,
  WizardStep4Schema,
} from '@/lib/validation/schemas'
import type { ApplicationFormData } from '@/types'
import {
  FormField, FormGrid, TextInput, TextArea, Select, Combo,
  CheckItem, RadioItem, DeployCard, FileZone, Divider, BtnRow,
} from '@/components/forms'

interface Props { jobId: string; jobTitle: string }

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

export default function ApplicationForm({ jobId, jobTitle }: Props) {
  const [step,       setStep]       = useState(1)
  const [data,       setData]       = useState<ApplicationFormData>({
    first_name: '', last_name: '', email: '', phone: '', nationality: '', country_of_residence: '',
    date_of_birth: '', has_valid_passport: false, deployment_pref: '', availability: '',
    licence_type: '', type_ratings: [], certifications: [], work_types: [], current_benefits: [],
    current_employer: '', total_years_exp: '',
  })
  const [files,      setFiles]      = useState<Record<string, File>>({})
  const [fileNames,  setFileNames]  = useState<Record<string, string>>({})
  const [consent,    setConsent]    = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [refCode,    setRefCode]    = useState('')
  const [error,      setError]      = useState('')
  const [isStepValid, setIsStepValid] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [hasDraft,   setHasDraft]   = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [lastSaved,  setLastSaved]  = useState<string | null>(null)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const topRef = useRef<HTMLDivElement>(null)
  const DRAFT_KEY = `aerojet-draft-${jobId}`

  const touch = (k: string) => setTouchedFields(p => ({ ...p, [k]: true }))

  const set = <K extends keyof ApplicationFormData>(k: K) => (v: ApplicationFormData[K]) => {
    setHasStarted(true)
    setData(d => ({ ...d, [k]: v }))
  }
  const toggleArr = (k: 'type_ratings' | 'certifications' | 'work_types' | 'current_benefits', v: string) => setData(d => {
    const arr: string[] = d[k] || []
    return { ...d, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }
  })
  const has = (k: 'type_ratings' | 'certifications' | 'work_types' | 'current_benefits', v: string) => !!(data[k] || []).includes(v)
  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)

  useEffect(() => {
    let result: { success: boolean } | undefined
    if (step === 1) result = WizardStep1Schema.safeParse(data)
    else if (step === 2) result = WizardStep2Schema.safeParse(data)
    else if (step === 3) result = WizardStep3Schema.safeParse(data)
    else if (step === 4) result = WizardStep4Schema.safeParse(data)
    else if (step === 5) result = { success: !!files.cv && consent }
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (!draft.hasStarted) return
      if (draft.data) setData(draft.data)
      if (draft.consent !== undefined) setConsent(draft.consent)
      if (draft.step) setStep(draft.step)
      setHasDraft(true)
      setHasStarted(true)
    } catch { /* ignore corrupt draft */ }
  }, [])

  useEffect(() => {
    if (submitted) {
      localStorage.removeItem(DRAFT_KEY)
      setLastSaved(null)
      return
    }
    if (!hasStarted) return
    const payload = { data, consent, step, lastSaved: new Date().toISOString(), hasStarted: true }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    setLastSaved(payload.lastSaved)
  }, [data, consent, step, submitted, hasStarted])

  const STEPS = ['Personal', 'Qualifications', 'Experience', 'Compensation', 'Documents']

  const goTo = (n: number) => { setStep(n); setError(''); scrollTop() }

  const markAllTouched = () => {
    const allFields = ['first_name','last_name','email','phone','nationality','country_of_residence','date_of_birth','licence_type','type_ratings','current_employer','total_years_exp','payment_preference']
    setTouchedFields(Object.fromEntries(allFields.map(k => [k, true])))
  }

  const next = () => {
    if (!isStepValid) { markAllTouched(); return }
    goTo(step + 1)
  }

  const restoreDraft = () => {
    setHasDraft(false)
    setLastSaved(null)
    scrollTop()
  }

  const saveDraft = () => {
    setError('')
    scrollTop()
  }

  const addFile = (key: string) => (f: File) => {
    if (f.size > 5 * 1024 * 1024) { setError('File must be under 5 MB.'); return }
    setFiles(p => ({ ...p, [key]: f }))
    setFileNames(p => ({ ...p, [key]: `${f.name} (${Math.round(f.size / 1024)} KB)` }))
    setError('')
  }

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
    if (!isStepValid) { markAllTouched(); return }
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

      const uploadErrors: string[] = []
      for (const [key, file] of Object.entries(files)) {
        try {
          const fd = new FormData()
          fd.append('file',           file)
          fd.append('application_id', appId)
          fd.append('document_type',  key === 'cv' ? 'cv' : key === 'licence' ? 'licence_scan' : 'passport_scan')
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!uploadRes.ok) {
            const uploadResult = await uploadRes.json().catch(() => ({ error: 'Unknown upload error' }))
            uploadErrors.push(`${key}: ${uploadResult.error || `HTTP ${uploadRes.status}`}`)
          }
        } catch (e: any) {
          uploadErrors.push(`${key}: ${e.message || 'Network error'}`)
        }
      }

      if (uploadErrors.length > 0) {
        setError(`Application saved, but some files failed to upload: ${uploadErrors.join(', ')}. Please contact careers@aerojet-aviation.com with your reference number.`)
      }

      setRefCode(appRef || '')
      setSubmitted(true)
      localStorage.removeItem(DRAFT_KEY)
      setLastSaved(null)
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
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: active ? 'var(--navy)' : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          )
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
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

      {hasDraft && (
        <div style={{ background: 'var(--surface-accent-soft)', border: '1px solid var(--aero-sky)', borderRadius: 8, padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--aero-blue)' }}>
            You have a saved draft. Resume where you left off?
            {lastSaved && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
              (Last saved: {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </span>}
          </span>
          <button type="button" onClick={restoreDraft} className="btn btn-blue" style={{ padding: '0.5rem 1rem', fontSize: 13 }}>
            Resume Draft
          </button>
        </div>
      )}

      {/* Step 1: Personal */}
      {step === 1 && (
        <FormCard title="Personal details" subtitle="Tell us who you are and how to reach you. All information is treated in strict confidence.">
          <FormGrid>
            <FormField label="First name" required error={validationErrors.first_name} touched={!!touchedFields.first_name}>
              <TextInput name="given-name" autoComplete="given-name" value={data.first_name} onChange={set('first_name')} placeholder="Given name" error={validationErrors.first_name} touched={!!touchedFields.first_name} onBlur={() => touch('first_name')} />
            </FormField>
            <FormField label="Last name" required error={validationErrors.last_name} touched={!!touchedFields.last_name}>
              <TextInput name="family-name" autoComplete="family-name" value={data.last_name} onChange={set('last_name')} placeholder="Family name" error={validationErrors.last_name} touched={!!touchedFields.last_name} onBlur={() => touch('last_name')} />
            </FormField>
            <FormField label="Email address" required error={validationErrors.email} touched={!!touchedFields.email}>
              <TextInput type="email" name="email" autoComplete="email" inputMode="email" spellCheck={false} value={data.email} onChange={set('email')} placeholder="you@example.com" error={validationErrors.email} touched={!!touchedFields.email} onBlur={() => touch('email')} />
            </FormField>
            <FormField label="Phone / WhatsApp" required hint="Include your international dialing code, e.g. +233…" error={validationErrors.phone} touched={!!touchedFields.phone}>
              <TextInput type="tel" name="tel" autoComplete="tel" inputMode="tel" value={data.phone} onChange={set('phone')} placeholder="+233 20 000 0000" error={validationErrors.phone} touched={!!touchedFields.phone} onBlur={() => touch('phone')} />
            </FormField>
            <FormField label="Nationality" required error={validationErrors.nationality} touched={!!touchedFields.nationality}>
              <Select id="app-nationality" name="nationality" value={data.nationality} onChange={set('nationality')} options={NATIONALITIES} placeholder="Select nationality" error={validationErrors.nationality} touched={!!touchedFields.nationality} onBlur={() => touch('nationality')} />
            </FormField>
            <FormField label="Country of residence" required error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence}>
              <Select id="app-country" name="country_of_residence" value={data.country_of_residence} onChange={set('country_of_residence')} options={COUNTRIES} placeholder="Select country" error={validationErrors.country_of_residence} touched={!!touchedFields.country_of_residence} onBlur={() => touch('country_of_residence')} />
            </FormField>
          </FormGrid>
          <FormField label="Date of birth" required hint="You must be at least 18 years old to apply." error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth}>
            <TextInput type="date" id="app-dob" name="date_of_birth" value={data.date_of_birth} onChange={set('date_of_birth')} min={dobMin} max={dobMax} error={validationErrors.date_of_birth} touched={!!touchedFields.date_of_birth} onBlur={() => touch('date_of_birth')} />
          </FormField>
          <FormField label="Valid passport?">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <RadioItem label="Yes — valid passport held" value="true"  current={String(data.has_valid_passport)} onChange={v => set('has_valid_passport')(v === 'true')} />
              <RadioItem label="No — applying / expired"   value="false" current={String(data.has_valid_passport)} onChange={v => set('has_valid_passport')(v === 'true')} />
            </div>
          </FormField>
          <FormField label="Willingness to be deployed" required>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, lineHeight: 1.6 }}>
              Aerojet deploys engineers to our own hub locations and partner operator stations. Deployments may be in Africa or internationally.
            </p>
            <div className="deploy-grid">
              <DeployCard id="yes"   Icon={Check}  iconColor="var(--success)" title="Yes — fully flexible" sub="Willing to deploy to any Aerojet hub"       active={data.deployment_pref === 'fully_flexible'} onClick={() => set('deployment_pref')('fully_flexible')} />
              <DeployCard id="ghana" Icon={Circle} iconColor="#b8860b"        title="Ghana only"           sub="Deployment within Ghana at this time only"   active={data.deployment_pref === 'ghana_only'}      onClick={() => set('deployment_pref')('ghana_only')} />
              <DeployCard id="no"    Icon={X}      iconColor="var(--error)"   title="Not at this time"     sub="Not available for deployment away from base" active={data.deployment_pref === 'not_available'}   onClick={() => set('deployment_pref')('not_available')} />
            </div>
          </FormField>
          <FormField label="Availability for deployment">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <RadioItem label="Immediately available" value="immediately"   current={data.availability} onChange={set('availability')} />
              <RadioItem label="Subject to notice"     value="notice_period" current={data.availability} onChange={set('availability')} />
              <RadioItem label="Open to discussion"    value="discuss"       current={data.availability} onChange={set('availability')} />
            </div>
          </FormField>
          <BtnRow onNext={next} disabled={!isStepValid} onSaveDraft={saveDraft} />
        </FormCard>
      )}

      {/* Step 2: Qualifications */}
      {step === 2 && (
        <FormCard title="Licences & qualifications" subtitle="Provide your current regulatory licences and authorisations.">
          <FormGrid>
            <FormField label="Primary licence" required error={validationErrors.licence_type} touched={!!touchedFields.licence_type}>
              <Select id="app-licence-type" name="licence_type" value={data.licence_type} onChange={set('licence_type')} options={['EASA Part-66 B1.1','EASA Part-66 B2','EASA Part-66 B1.1 + B2','ECAA (Ethiopian)','KCAA (Kenya)','GCAA (Ghana)','NCAA (Nigeria)','FAA A&P','Other']} error={validationErrors.licence_type} touched={!!touchedFields.licence_type} onBlur={() => touch('licence_type')} />
            </FormField>
            <FormField label="Licence number">
              <TextInput id="app-licence-number" name="licence_number" value={data.licence_number} onChange={set('licence_number')} placeholder="e.g. EASA.B1.ET.XXXXX" />
            </FormField>
            <FormField label="Issuing authority">
              <TextInput id="app-issuing-authority" name="issuing_authority" value={data.issuing_authority} onChange={set('issuing_authority')} placeholder="e.g. ECAA, KCAA, EASA" />
            </FormField>
            <FormField label="Licence expiry">
              <TextInput type="date" id="app-licence-expiry" name="licence_expiry" value={data.licence_expiry} onChange={set('licence_expiry')} />
              {licenceExpired && <p className="field-hint" style={{ color: 'var(--warning)' }}>This licence appears to have expired.</p>}
            </FormField>
          </FormGrid>
          <Divider />
          <FormField label="Current type ratings" required error={validationErrors.type_ratings} touched={!!touchedFields.type_ratings}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Select all that are currently on your licence.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['B737NG','Boeing 737 NG (B1 — CFM56)'],['B737MAX','Boeing 737 MAX (B1 — CFM LEAP)'],['E190','Embraer E190 / E195'],['A320','Airbus A320 family'],['B787','Boeing 787'],['B777','Boeing 777'],['other','Other (specify below)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('type_ratings', v)} onChange={() => toggleArr('type_ratings', v)} />
              ))}
            </div>
          </FormField>
          {has('type_ratings', 'other') && (
            <FormField label="Other type ratings">
              <TextInput id="app-other-type-ratings" name="other_type_ratings" value={data.other_type_ratings} onChange={set('other_type_ratings')} placeholder="List any additional types not shown above" />
            </FormField>
          )}
          <Divider />
          <FormField label="Additional certifications">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['HF','Human Factors (EASA-recognised)'],['DG','Dangerous Goods Awareness'],['SMS','Safety Management Systems (SMS)'],['Avionics','Avionics / B2 authorisation'],['NDT','NDT (Non-Destructive Testing)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('certifications', v)} onChange={() => toggleArr('certifications', v)} />
              ))}
            </div>
          </FormField>
          <FormField label="Highest educational qualification">
            <Select id="app-highest-qualification" name="highest_qualification" value={data.highest_qualification} onChange={set('highest_qualification')} options={['AMT Certificate','Diploma in Aero Engineering','BSc Aero/Mech Engineering','BSc Electrical Engineering',"Master's Degree",'Other']} />
          </FormField>
          {data.highest_qualification === 'Other' && (
            <FormField label="Please specify your qualification">
              <TextInput id="app-highest-qualification-other" name="highest_qualification_other" value={data.highest_qualification_other} onChange={set('highest_qualification_other')} placeholder="Your highest qualification" />
            </FormField>
          )}
          <BtnRow onBack={() => goTo(1)} onNext={next} disabled={!isStepValid} onSaveDraft={saveDraft} />
        </FormCard>
      )}

      {/* Step 3: Experience */}
      {step === 3 && (
        <FormCard title="Work experience" subtitle="Tell us about your current and previous roles.">
          <FormGrid>
            <FormField label="Current employer" required error={validationErrors.current_employer} touched={!!touchedFields.current_employer}>
              <TextInput id="app-current-employer" name="current_employer" value={data.current_employer} onChange={set('current_employer')} placeholder="e.g. Ethiopian Airlines" error={validationErrors.current_employer} touched={!!touchedFields.current_employer} onBlur={() => touch('current_employer')} />
            </FormField>
            <FormField label="Job title / grade">
              <TextInput id="app-job-title" name="job_title" value={data.job_title} onChange={set('job_title')} placeholder="e.g. Senior LAE" />
            </FormField>
            <FormField label="Start date (current role)">
              <TextInput type="date" id="app-role-start" name="role_start_date" value={data.role_start_date} onChange={set('role_start_date')} max={new Date().toISOString().slice(0, 10)} />
            </FormField>
            <FormField label="End date (if applicable)">
              <TextInput type="date" id="app-role-end" name="role_end_date" value={data.role_end_date} onChange={set('role_end_date')} min={data.role_start_date || undefined} />
              {data.role_start_date && data.role_end_date && data.role_end_date < data.role_start_date && (
                <p className="field-hint" style={{ color: 'var(--error)' }}>End date must be after the start date.</p>
              )}
            </FormField>
          </FormGrid>
          <FormField label="Total years of experience" required error={validationErrors.total_years_exp} touched={!!touchedFields.total_years_exp}>
            <Select id="app-total-years" name="total_years_exp" value={data.total_years_exp} onChange={set('total_years_exp')} options={['Less than 3 years','3–5 years','6–8 years','9–12 years','13–15 years','15+ years']} error={validationErrors.total_years_exp} touched={!!touchedFields.total_years_exp} onBlur={() => touch('total_years_exp')} />
          </FormField>
          <FormField label="Types of work">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[['transit','Line maintenance — transit'],['acheck','A-checks / scheduled'],['aog','AOG / defect rectification'],['heavymaint','Heavy maintenance / C-checks'],['other','Other (specify below)']].map(([v,l]) => (
                <CheckItem key={v} label={l} checked={has('work_types', v)} onChange={() => toggleArr('work_types', v)} />
              ))}
            </div>
          </FormField>
          {has('work_types', 'other') && (
            <FormField label="Please specify other work types">
              <TextInput id="app-work-types-other" name="work_types_other" value={data.work_types_other} onChange={set('work_types_other')} placeholder="Describe other maintenance work" />
            </FormField>
          )}
          <FormField label="Outstation experience">
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
              <RadioItem label="Extensive" value="extensive" current={data.outstation_exp} onChange={set('outstation_exp')} />
              <RadioItem label="Some"      value="some"      current={data.outstation_exp} onChange={set('outstation_exp')} />
              <RadioItem label="Base only" value="none"      current={data.outstation_exp} onChange={set('outstation_exp')} />
            </div>
          </FormField>
           <FormField label="Motivation">
            <TextArea id="app-motivation" name="motivation" value={data.motivation} onChange={set('motivation')} placeholder="What draws you to this role and our company?" />
          </FormField>
          <BtnRow onBack={() => goTo(2)} onNext={next} disabled={!isStepValid} onSaveDraft={saveDraft} />
        </FormCard>
      )}

      {/* Step 4: Compensation */}
      {step === 4 && (
        <FormCard title="Compensation & availability" subtitle="Ensuring we offer you a competitive package. All data is confidential.">
          <FormGrid>
             <FormField label="Current salary (monthly)">
              <TextInput type="number" id="app-current-salary" name="current_salary" min={0} step={100} value={data.current_salary} onChange={v => set('current_salary')(v === '' ? undefined : Number(v))} placeholder="0" />
            </FormField>
            <FormField label="Currency">
              <Select id="app-salary-currency" name="current_salary_currency" value={data.current_salary_currency || 'USD'} onChange={set('current_salary_currency')} options={['USD','ETB','KES','GHS','ZAR','NGN','EUR']} />
            </FormField>
          </FormGrid>
          <FormField label="Current benefits">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {[['housing','Housing allowance'],['medical','Medical insurance'],['flights','Staff travel'],['pension','Pension fund']].map(([v,l]) => (
                  <CheckItem key={v} label={l} checked={has('current_benefits', v)} onChange={() => toggleArr('current_benefits', v)} />
                ))}
            </div>
          </FormField>
          <Divider />
          <FormGrid>
             <FormField label="Salary expectation (Min USD)">
              <TextInput type="number" id="app-expected-min" name="expected_min_usd" min={0} step={100} value={data.expected_min_usd} onChange={v => set('expected_min_usd')(v === '' ? undefined : Number(v))} placeholder="0" />
            </FormField>
             <FormField label="Salary expectation (Target USD)">
              <TextInput type="number" id="app-expected-target" name="expected_target_usd" min={0} step={100} value={data.expected_target_usd} onChange={v => set('expected_target_usd')(v === '' ? undefined : Number(v))} placeholder="0" />
              {data.expected_min_usd && data.expected_target_usd && Number(data.expected_target_usd) < Number(data.expected_min_usd) && (
                <p className="field-hint" style={{ color: 'var(--error)' }}>Target should be at least the minimum.</p>
              )}
            </FormField>
          </FormGrid>
          <FormField label="Preferred payment arrangement" required error={validationErrors.payment_preference} touched={!!touchedFields.payment_preference}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {[['usd_home','USD — paid to home country account'],['local_home','Local currency — paid to home account']].map(([v,l]) => (
                <RadioItem key={v} label={l} value={v} current={data.payment_preference} onChange={set('payment_preference')} />
              ))}
            </div>
          </FormField>
          <FormField label="Deployment arrangement preference">
             <Select id="app-deployment-arrangement" name="deployment_arrangement" value={data.deployment_arrangement} onChange={set('deployment_arrangement')} options={['Rotation (4 on / 2 off)','Rotation (6 on / 3 off)','Open to discussion','Other']} />
          </FormField>
          {data.deployment_arrangement === 'Other' && (
            <FormField label="Please specify arrangement">
              <TextInput id="app-deployment-other" name="deployment_arrangement_other" value={data.deployment_arrangement_other} onChange={set('deployment_arrangement_other')} placeholder="Preferred rotation / arrangement" />
            </FormField>
          )}
          <BtnRow onBack={() => goTo(3)} onNext={next} disabled={!isStepValid} onSaveDraft={saveDraft} />
        </FormCard>
      )}

      {/* Step 5: Documents */}
      {step === 5 && (
        <FormCard title="Documents & submission" subtitle="Upload your CV and supporting documents to finish your application.">
          <FormField label="CV / Résumé" required>
            <FileZone id="app-cv" label="Click to upload your CV" sub="PDF, DOC or DOCX · Max 5 MB" chosen={fileNames.cv} onFile={addFile('cv')} accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
          </FormField>
          <FormGrid>
            <FormField label="Licence scan (Part-66 / etc.)">
                <FileZone id="app-licence" label="Upload licence scan" sub="PDF or Image · Max 5 MB" chosen={fileNames.licence} onFile={addFile('licence')} accept=".pdf,image/*" />
            </FormField>
            <FormField label="Passport scan">
                <FileZone id="app-passport" label="Upload passport data page" sub="PDF or Image · Max 5 MB" chosen={fileNames.passport} onFile={addFile('passport')} accept=".pdf,image/*" />
            </FormField>
          </FormGrid>

          <Divider />

          <FormField label="How did you hear about us?">
             <Select id="app-source" name="source" value={data.source} onChange={set('source')} options={['LinkedIn','Ethiopian internal network','Kenya Airways network','Colleague referral','Aerojet website','Job board','Other']} />
          </FormField>
          {data.source === 'Other' && (
            <FormField label="Please specify">
              <TextInput id="app-source-other" name="source_other" value={data.source_other} onChange={set('source_other')} placeholder="How did you hear about us?" />
            </FormField>
          )}

          <div style={{ background: '#eaf3fa', border: '1px solid #b5caeb', padding: '0.875rem 1.1rem', borderRadius: 8, marginBottom: '1rem' }}>
            <p style={{ fontSize: 12, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
              By submitting this application you confirm that the information provided is accurate and complete. Your personal data will be processed by Aerojet Aviation solely for evaluating your candidacy. Data is stored securely and will not be shared with third parties without your consent. You may request access to or deletion of your data by contacting <strong>careers@aerojet-aviation.com</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 8, background: '#fafbfc', marginBottom: '1rem' }}>
            <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              I confirm the above and consent to my data being processed for recruitment purposes <span style={{ color: 'var(--blue)' }}>*</span>
            </span>
          </div>

          <BtnRow
            onBack={() => goTo(4)}
            onNext={submit}
            disabled={!isStepValid || submitting}
            nextLabel={submitting ? 'Submitting…' : 'Submit application'}
            onSaveDraft={saveDraft}
          />
        </FormCard>
      )}
    </div>
  )
}
