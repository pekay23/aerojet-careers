'use client'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner, FormCard } from '@/components/ui'

const DEPARTMENTS = ['Engineering','IT','Operations','HR','Customer Support','Sales','Logistics','Quality']

const RegistrationSchema = z.object({
  first_name: z.string().min(2, "First name too short"),
  last_name: z.string().min(2, "Last name too short"),
  email: z.string().email("Invalid email address"),
  nationality: z.string().min(1, "Selection required"),
  country: z.string().min(1, "Selection required"),
  years_experience: z.string().min(1, "Selection required"),
  qualification: z.string().min(1, "Selection required"),
})

export default function RegisterPage() {
  const [data,      setData]      = useState<Record<string, any>>({})
  const [cvFile,    setCvFile]    = useState<File | null>(null)
  const [cvName,    setCvName]    = useState('')
  const [consent,   setConsent]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting,setSubmitting]= useState(false)
  const [isValid,   setIsValid]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    const result = RegistrationSchema.safeParse(data)
    setIsValid(result.success)
  }, [data])

  const canSubmit = isValid && !!cvFile && consent && !submitting

  const set = (k: string) => (v: any) => setData(d => ({ ...d, [k]: v }))
  const toggleDept = (d: string) => {
    setData(prev => {
      const arr: string[] = prev.departments_interest || []
      return { ...prev, departments_interest: arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d] }
    })
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setError('')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'departments_interest') {
          fd.append(k, JSON.stringify(v || []))
        } else if (v !== undefined && v !== null) {
          fd.append(k, String(v))
        }
      })
      if (cvFile) {
        fd.append('file', cvFile)
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        body: fd,
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || `Server error (${res.status}). Please check your connection and try again.`)
      }

      setSubmitted(true)
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <SiteNav />
      <PageHero title="General Application" subtitle="Register your profile and we will contact you when a matching role opens" image="/images/7.jpg" height={300} />

      <section className="section-white">
        <div className="container-max mx-auto" style={{ maxWidth: 760 }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <NoticeBanner>
              <strong>Don't see the right role?</strong> Register your interest and join our talent pool. When suitable positions open across <strong>Engineering, IT, Operations, HR, Customer Support, Sales, Logistics</strong> or <strong>Quality</strong>, we will reach out directly.
            </NoticeBanner>
          </div>

          {submitted ? (
            <div className="card card-inner" style={{ textAlign: 'center' }}>
              <div className="success-icon-circle">
                <svg width="26" height="26" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="5,14 11,20 23,8" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Profile registered</h2>
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Thank you for registering with Aerojet Aviation. Your profile has been added to our talent pool.
                We will contact you when a matching opportunity opens.
              </p>
            </div>
          ) : (
            <>
              <FormCard title="Your details" subtitle="Tell us about yourself and the kind of role you are looking for.">
                <div className="grid-auto-sm">
                  {[['first_name','First name',true,'Given name','given-name'],['last_name','Last name',true,'Family name','family-name'],['email','Email address',true,'you@example.com','email'],['phone','Phone / WhatsApp',false,'+233…','tel']].map(([k,l,req,ph,ac]) => (
                    <div key={k as string} className="field">
                      <label className="field-label" htmlFor={`reg-${k}`}>{l as string}{req && <span style={{ color: 'var(--blue)', marginLeft: 2 }}>*</span>}</label>
                      <input
                        id={`reg-${k}`}
                        name={k as string}
                        type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : 'text'}
                        autoComplete={ac as string}
                        inputMode={k === 'email' ? 'email' : k === 'phone' ? 'tel' : undefined}
                        spellCheck={k === 'email' ? false : undefined}
                        value={data[k as string] ?? ''}
                        onChange={e => set(k as string)(e.target.value)}
                        placeholder={ph as string}
                        className="field-input"
                      />
                    </div>
                  ))}
                  <div className="field">
                    <label className="field-label" htmlFor="reg-nationality">Nationality <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select id="reg-nationality" value={data.nationality ?? ''} onChange={e => set('nationality')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['Ghanaian','Nigerian','Kenyan','Ethiopian','Other African','Other'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="reg-country">Country of residence <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select id="reg-country" value={data.country ?? ''} onChange={e => set('country')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['Ghana','Nigeria','Kenya','Ethiopia','Other African country','Outside Africa'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="reg-years">Years of experience <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select id="reg-years" value={data.years_experience ?? ''} onChange={e => set('years_experience')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['0–1 years','1–3 years','3–5 years','5–10 years','10–15 years','15+ years'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="reg-qualification">Highest qualification <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select id="reg-qualification" value={data.qualification ?? ''} onChange={e => set('qualification')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['Secondary School Certificate','OND / HND','Professional Certificate (AME, etc.)','Bachelor\'s Degree','Master\'s Degree','PhD / Doctorate'].map(q => <option key={q}>{q}</option>)}
                    </select>
                  </div>
                </div>
              </FormCard>

              <FormCard title="Areas of interest" subtitle="Select all departments you would like to be considered for.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {DEPARTMENTS.map(d => {
                    const checked = (data.departments_interest || []).includes(d)
                    return (
                      <label key={d} className={`checkbox-item${checked ? ' checked' : ''}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleDept(d)} style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>{d}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="field" style={{ marginTop: '1.25rem' }}>
                  <label className="field-label" htmlFor="reg-statement">Brief statement of interest</label>
                  <textarea id="reg-statement" value={data.statement ?? ''} onChange={e => set('statement')(e.target.value)} placeholder="Tell us about your background and what draws you to Aerojet Aviation…" className="field-input" style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
                </div>
              </FormCard>

              <FormCard title="Documents" subtitle="Attach your CV so we can review your profile when a matching role opens.">
                <div className="field">
                  <label className="field-label" htmlFor="reg-cv">CV / Résumé <span style={{ color: 'var(--blue)' }}>*</span></label>
                  <div className={`upload-zone${cvFile ? ' has-file' : ''}`}>
                    <input id="reg-cv" type="file" accept=".pdf,.doc,.docx" onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setCvFile(f); setCvName(`${f.name} (${Math.round(f.size / 1024)} KB)`) }
                    }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} aria-label="Upload CV" />
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 3 }}>Click to upload your CV</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>PDF, DOC or DOCX · Max 5 MB</div>
                    {cvName && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginTop: 6 }}>✓ {cvName}</div>}
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="reg-source">How did you hear about Aerojet?</label>
                  <select id="reg-source" value={data.source ?? ''} onChange={e => set('source')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                    <option value="">Select…</option>
                    {['LinkedIn','Colleague referral','Aerojet website','Aviation industry forum','Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div className="info-box">
                  <p style={{ margin: 0 }}>
                    By submitting, you confirm the information is accurate and consent to Aerojet Aviation processing your data for recruitment purposes. Contact <strong>careers@aerojet-aviation.com</strong> to request deletion.
                  </p>
                </div>

                <label className="consent-label">
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>I confirm the above and consent to data processing <span style={{ color: 'var(--blue)' }}>*</span></span>
                </label>

                {error && <div className="info-box" style={{ background: 'var(--error-bg)', border: '1px solid #f0bfbf', color: 'var(--error)' }}>{error}</div>}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="btn btn-blue"
                  style={{
                    opacity: canSubmit ? 1 : 0.6,
                    cursor: canSubmit ? 'pointer' : 'not-allowed'
                  }}
                >
                  {submitting ? 'Registering…' : 'Register My Interest →'}
                </button>
              </FormCard>
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
