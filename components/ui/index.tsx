import type { ApplicationStatus, JobStatus } from '@/types'

// ── Status pill ────────────────────────────────────────────────────────────
const STATUS_CLASS: Record<string, string> = {
  new:               'pill pill-new',
  under_review:      'pill pill-under-review',
  shortlisted:       'pill pill-shortlisted',
  interview:         'pill pill-interview',
  offer:             'pill pill-offer',
  hired:             'pill pill-hired',
  rejected:          'pill pill-rejected',
  transferred_to_hr: 'pill pill-transferred',
  withdrawn:         'pill pill-draft',
  open:              'pill pill-open',
  draft:             'pill pill-draft',
  closed:            'pill pill-closed',
  paused:            'pill pill-paused',
  filled:            'pill pill-hired',
}

const STATUS_LABEL: Record<string, string> = {
  new:               'New',
  under_review:      'Under Review',
  shortlisted:       'Shortlisted',
  interview:         'Interview',
  offer:             'Offer',
  hired:             'Hired',
  rejected:          'Rejected',
  transferred_to_hr: 'Transferred to HR',
  withdrawn:         'Withdrawn',
  open:              'Open',
  draft:             'Draft',
  closed:            'Closed',
  paused:            'Paused',
  filled:            'Filled',
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={STATUS_CLASS[status] || 'pill pill-draft'}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

// ── Page hero banner ───────────────────────────────────────────────────────
export function PageHero({
  title, subtitle, image = '/images/mro1-BNITgFHH.jpg', height = 360,
}: {
  title: string
  subtitle?: string
  image?: string
  height?: number
}) {
  return (
    <div
      className="relative flex items-center justify-center text-white text-center page-pad"
      style={{ minHeight: height, backgroundImage: `url('${image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(15, 23, 42, 0.62)' }} />
      <div className="relative z-10 max-w-3xl px-8 py-16">
        <h1 style={{ color: 'white', fontSize: '2.25rem', marginBottom: subtitle ? '0.6rem' : 0 }}>{title}</h1>
        {subtitle && <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  )
}

// ── Notice banner ──────────────────────────────────────────────────────────
export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--info-soft)', borderLeft: '4px solid var(--info)',
      borderRadius: 'var(--radius-md)', padding: '0.875rem 1.25rem',
      fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

// ── Form section card ──────────────────────────────────────────────────────
export function FormCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="card fade-in" style={{ padding: '2rem 2.25rem', marginBottom: '1rem' }}>
      <div className="accent-bar" />
      <h3 style={{ fontSize: '1.35rem', marginBottom: subtitle ? '0.35rem' : '1.5rem' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{subtitle}</p>}
      {children}
    </div>
  )
}

// ── Table empty state ──────────────────────────────────────────────────────
export function EmptyState({ icon = '📋', message }: { icon?: string; message: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted-foreground)' }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.3, marginBottom: '1rem' }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{message}</p>
    </div>
  )
}
