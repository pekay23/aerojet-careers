'use client'
import { useState } from 'react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import { CheckCircle2 } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  new:              { label: 'Application Received', color: 'var(--blue)', bg: '#eaf3fa' },
  under_review:     { label: 'Under Review', color: '#b8860b', bg: '#fefce8' },
  shortlisted:      { label: 'Shortlisted', color: 'var(--success)', bg: '#f0faf5' },
  interview:        { label: 'Interview Stage', color: '#7c3aed', bg: '#f5f3ff' },
  offer:            { label: 'Offer Extended', color: 'var(--success)', bg: '#f0faf5' },
  hired:            { label: 'Hired', color: 'var(--success)', bg: '#f0faf5' },
  rejected:         { label: 'Not Selected', color: 'var(--error)', bg: '#fef2f2' },
  transferred_to_hr:{ label: 'Transferred to HR', color: '#b8860b', bg: '#fefce8' },
  withdrawn:        { label: 'Withdrawn', color: 'var(--muted)', bg: '#fafbfc' },
}

export default function CheckStatusClient() {
  const [refCode, setRefCode] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/check-status?ref=${encodeURIComponent(refCode.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Application not found. Please check your reference code.')
      } else {
        setResult(data.data)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SiteNav />
      <PageHero
        title="Check Application Status"
        subtitle="Enter your reference code to see the latest update on your application."
        height={300}
      />

      <section className="section-white">
        <div className="container-max mx-auto" style={{ maxWidth: 600 }}>
          <div className="card card-inner">
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="ref">Reference Code <span style={{ color: 'var(--blue)' }}>*</span></label>
                <input
                  id="ref"
                  name="ref"
                  autoComplete="off"
                  value={refCode}
                  onChange={e => setRefCode(e.target.value)}
                  className="field-input"
                  placeholder="e.g. AERO-ENG-001"
                  required
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-blue" style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'Checking…' : 'Check Status'}
              </button>
            </form>

            {error && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--error-bg)', border: '1px solid #f0bfbf', borderRadius: 8, color: 'var(--error)', fontSize: 13 }}>
                {error}
              </div>
            )}

            {result && (
              <div style={{ marginTop: '1.5rem' }} className="fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: STATUS_LABELS[result.status]?.bg || 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: STATUS_LABELS[result.status]?.color || 'var(--navy)' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Current Status</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: STATUS_LABELS[result.status]?.color || 'var(--navy)' }}>
                      {STATUS_LABELS[result.status]?.label || result.status}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Reference</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{result.ref_code}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Position</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{result.job_title || 'General Application'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Submitted</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
                      {new Date(result.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {result.qualifications && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Licence</div>
                    <div style={{ fontSize: 13, color: 'var(--navy)' }}>{result.qualifications.licence_type || '—'}</div>
                    {result.qualifications.licence_expiry && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Expires: {new Date(result.qualifications.licence_expiry).toLocaleDateString('en-GB')}</div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eaf3fa', border: '1px solid #b5caeb', borderRadius: 8 }}>
                  <p style={{ fontSize: 13, color: '#1a3560', lineHeight: 1.7, margin: 0 }}>
                    For questions about your application, email <a href="mailto:careers@aerojet-aviation.com" style={{ color: 'var(--blue)' }}>careers@aerojet-aviation.com</a> with your reference code.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
