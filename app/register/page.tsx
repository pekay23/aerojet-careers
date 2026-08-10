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
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, departments_interest: data.departments_interest || [] }),
      })
      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || `Server error (${res.status}). Please check your connection and try again.`)
      }

      const talentId = result.data?.id
      if (cvFile && talentId) {
        const fd = new FormData()
        fd.append('file', cvFile)
        fd.append('talent_pool_id', talentId)
        await fetch('/api/upload/talent', { method: 'POST', body: fd })
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

      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <NoticeBanner>
              <strong>Don't see the right role?</strong> Register your interest and join our talent pool. When suitable positions open across <strong>Engineering, IT, Operations, HR, Customer Support, Sales, Logistics</strong> or <strong>Quality</strong>, we will reach out directly.
            </NoticeBanner>
          </div>

          {submitted ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--bg-light)' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>

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
                        className="field-input transition-all focus:border-blue-400"
                      />
                    </div>
                  ))}

                  <div className="field">
                    <label className="field-label">Nationality <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select value={data.nationality ?? ''} onChange={e => set('nationality')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['Ghanaian','Nigerian','Kenyan','Ethiopian','Other African','Other'].map(n => <option key={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Country of residence <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select value={data.country ?? ''} onChange={e => set('country')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['Ghana','Nigeria','Kenya','Ethiopia','Other African country','Outside Africa'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Years of experience <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select value={data.years_experience ?? ''} onChange={e => set('years_experience')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                      <option value="">Select…</option>
                      {['0–1 years','1–3 years','3–5 years','5–10 years','10–15 years','15+ years'].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">Highest qualification <span style={{ color: 'var(--blue)' }}>*</span></label>
                    <select value={data.qualification ?? ''} onChange={e => set('qualification')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
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
                      <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.6rem 0.875rem', border: `1px solid ${checked ? 'var(--blue)' : 'var(--border)'}`, borderRadius: 3, background: checked ? '#eaf3fa' : '#fafbfc', transition: 'all 0.15s' }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleDept(d)} style={{ width: 15, height: 15, accentColor: 'var(--blue)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13 }}>{d}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="field" style={{ marginTop: '1.25rem' }}>
                  <label className="field-label">Brief statement of interest</label>
                  <textarea value={data.statement ?? ''} onChange={e => set('statement')(e.target.value)} placeholder="Tell us about your background and what draws you to Aerojet Aviation…" className="field-input" style={{ resize: 'vertical', minHeight: 80, lineHeight: 1.6 }} />
                </div>
              </FormCard>

              <FormCard title="Documents" subtitle="Attach your CV so we can review your profile when a matching role opens.">
                <div className="field">
                  <label className="field-label">CV / Résumé <span style={{ color: 'var(--blue)' }}>*</span></label>
                  <div style={{
                    position: 'relative', border: `2px dashed ${cvFile ? 'var(--success)' : 'var(--border)'}`,
                    borderRadius: 4, padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#fafbfc'
                  }}>
                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) { setCvFile(f); setCvName(`${f.name} (${Math.round(f.size / 1024)} KB)`) }
                    }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)', marginBottom: 3 }}>Click to upload your CV</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>PDF, DOC or DOCX · Max 5 MB</div>
                    {cvName && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', marginTop: 6 }}>✓ {cvName}</div>}
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">How did you hear about Aerojet?</label>
                  <select value={data.source ?? ''} onChange={e => set('source')(e.target.value)} className="field-input" style={{ cursor: 'pointer' }}>
                    <option value="">Select…</option>
                    {['LinkedIn','Colleague referral','Aerojet website','Aviation industry forum','Other'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                <div style={{ border: '1px solid #b5caeb', background: '#eaf3fa', padding: '0.875rem 1.1rem', borderRadius: 3, marginBottom: '1rem' }}>
                  <p style={{ fontSize: 12, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
                    By submitting, you confirm the information is accurate and consent to Aerojet Aviation processing your data for recruitment purposes. Contact <strong>careers@aerojet-aviation.com</strong> to request deletion.
                  </p>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: 3, background: '#fafbfc', marginBottom: '1rem' }}>
                  <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--navy)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>I confirm the above and consent to data processing <span style={{ color: 'var(--blue)' }}>*</span></span>
                </label>

                {error && <div style={{ background: 'var(--error-bg)', border: '1px solid #f0bfbf', color: 'var(--error)', padding: '0.75rem 1rem', borderRadius: 3, fontSize: 13, marginBottom: '1rem' }}>{error}</div>}

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
