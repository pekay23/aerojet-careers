'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react'
import { StatusPill, EmptyState, SkeletonCard } from '@/components/ui'

import type { Job } from '@/types'

export default function JobsClient({ initialJobs, loading = false }: { initialJobs: Job[]; loading?: boolean }) {
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
      <div className="flex flex-wrap gap-3 items-center mb-8">
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
        <span className="text-xs text-[var(--muted)] ml-auto">
          {filtered.length} role{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Job list or skeleton */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={3} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          message="No roles match your search."
          action={
            <Link href="/register" className="text-sm text-[var(--blue)] hover:underline mt-2">
              Submit a general application →
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
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
      className="job-row card"
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--blue)] mb-1">
            {job.department}
          </div>
          <h3 className="text-base font-bold text-[var(--navy)] mb-1">{job.title}</h3>
          {job.salary_range_min !== null && job.salary_range_max !== null ? (
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
              USD {job.salary_range_min.toLocaleString()} – {job.salary_range_max.toLocaleString()} per month
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
              Competitive
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)] mb-2">
            <span className="inline-flex items-center gap-1"><MapPin size={14} aria-hidden="true" /> {job.location}</span>
            <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> {job.employment_type.replace(/_/g, ' ')}</span>
            <span className="inline-flex items-center gap-1"><Users size={14} aria-hidden="true" /> {job.target_count ? `${job.target_count} ${job.target_count === 1 ? 'Vacancy' : 'Vacancies'}` : 'Open positions'}</span>
            {job.closes_at && <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> Closes {new Date(job.closes_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            {!job.closes_at && <span className="inline-flex items-center gap-1"><Clock size={14} aria-hidden="true" /> No deadline</span>}
          </div>
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.tags.slice(0, 5).map((tag: string) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <StatusPill status="open" />
          <ArrowRight size={20} aria-hidden="true" className="text-[var(--blue)] mt-1" />
        </div>
      </div>
    </Link>
  )
}
