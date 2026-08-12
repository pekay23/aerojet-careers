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
          id="job-search"
          name="search"
          autoComplete="off"
          aria-label="Search roles"
          placeholder="Search roles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="field-input"
          style={{ flex: 1, minWidth: 200, maxWidth: 320 }}
        />
        <select
          id="job-department-filter"
          name="department"
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
        <div className="flex flex-col gap-4" style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
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
      className="job-row card job-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem',
        minWidth: 0,
      }}
    >
      {/* Header: department + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {job.department}
        </span>
        <StatusPill status={job.status} />
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', lineHeight: 1.3, margin: 0 }}>
        {job.title}
      </h3>

      {/* Salary */}
      {job.salary_range_min !== null && job.salary_range_max !== null ? (
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
          USD {job.salary_range_min.toLocaleString()} – {job.salary_range_max.toLocaleString()}
          <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>per month</span>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Competitive</div>
      )}

      {/* Metadata — single aligned row on desktop, stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.5rem 1.5rem',
      }}>
        <MetaItem icon={MapPin} label={job.location} />
        <MetaItem icon={Clock} label={job.employment_type.replace(/_/g, ' ')} />
        <MetaItem icon={Users} label={job.target_count ? `${job.target_count} ${job.target_count === 1 ? 'Vacancy' : 'Vacancies'}` : 'Open positions'} />
        <MetaItem icon={Clock} label={job.closes_at ? `Closes ${new Date(job.closes_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No deadline'} />
      </div>

      {/* Tags + arrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {job.tags && job.tags.length > 0 && job.tags.slice(0, 3).map((tag: string) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
        <ArrowRight size={18} aria-hidden="true" style={{ color: 'var(--blue)', flexShrink: 0 }} />
      </div>
    </Link>
  )
}

function MetaItem({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string; style?: React.CSSProperties }>; label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'var(--muted)',
      lineHeight: 1.5,
    }}>
      <Icon size={14} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--blue)' }} />
      {label}
    </span>
  )
}
