'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react'
import { StatusPill } from '@/components/ui'

import type { Job } from '@/types'

export default function JobsClient({ initialJobs }: { initialJobs: Job[] }) {
  const [search, setSearch] = useState('')
  const [dept,   setDept]   = useState('')
  const [departments, setDepartments] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/metadata')
      .then(r => r.json())
      .then(({ data }) => {
        if (data && data.departments) {
          setDepartments(data.departments.map((d: any) => d.name))
        }
      })
  }, [])

  const filtered = useMemo(() => initialJobs.filter(j => {
    const q = search.toLowerCase()
    return (
      (!q || j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || (j.tags || []).some((t: string) => t.toLowerCase().includes(q))) &&
      (!dept || j.department === dept)
    )
  }), [initialJobs, search, dept])

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <input
          type="search"
          name="search"
          aria-label="Search roles"
          placeholder="Search roles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input"
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
        />
        <select
          value={dept}
          onChange={e => setDept(e.target.value)}
          aria-label="Filter by department"
          className="field-input"
          style={{ width: 200 }}
        >

          <option value="">All Departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
          {filtered.length} role{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: 14, marginBottom: '0.5rem' }}>No roles match your search.</p>
          <Link href="/register" style={{ color: 'var(--blue)', fontSize: 13 }}>
            Submit a general application →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(job => <JobRow key={job.id} job={job} />)}
        </div>
      )}
    </>
  )
}

function JobRow({ job }: { job: Job }) {
  return (
    <Link
      href={`/apply/${job.slug}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div
        className="card"
        style={{
          padding: '1.375rem 1.75rem',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '1.5rem', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 16px rgba(44,62,80,0.12)'; el.style.transform = 'translateY(-1px)' }}
        onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = ''; el.style.transform = '' }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue)', marginBottom: '0.35rem' }}>
            {job.department}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>{job.title}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: 13, color: 'var(--muted)', marginBottom: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={15} aria-hidden="true" /> {job.location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} aria-hidden="true" /> {job.employment_type.replace(/_/g, ' ')}</span>
            {job.target_count && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={15} aria-hidden="true" /> {job.target_count} {job.target_count === 1 ? 'Vacancy' : 'Vacancies'}</span>}

          </div>
          {job.tags && job.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {job.tags.slice(0, 5).map((tag: string) => (
                <span key={tag} style={{
                  background: '#eaf3fa', color: 'var(--navy)', border: '1px solid #c5dff0',
                  padding: '0.2rem 0.65rem', borderRadius: 20, fontSize: 11, fontWeight: 500,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
          <StatusPill status="open" />
          <ArrowRight size={20} aria-hidden="true" style={{ color: 'var(--blue)', marginTop: '0.5rem' }} />

        </div>
      </div>
    </Link>
  )
}
