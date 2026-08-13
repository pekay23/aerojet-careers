import React from 'react'

/**
 * Canonical status pill. Uses the token-driven `.pill` classes defined in
 * globals.css so colors stay consistent with the design system (no hardcoded
 * Tailwind palette values).
 */
const STATUS_CLASS: Record<string, string> = {
  new: 'pill pill-new',
  under_review: 'pill pill-under-review',
  shortlisted: 'pill pill-shortlisted',
  interview: 'pill pill-interview',
  offer: 'pill pill-offer',
  hired: 'pill pill-hired',
  rejected: 'pill pill-rejected',
  transferred_to_hr: 'pill pill-transferred',
  withdrawn: 'pill pill-draft',
  live: 'pill pill-open',
  draft: 'pill pill-draft',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
  transferred_to_hr: 'Transferred to HR',
  withdrawn: 'Withdrawn',
  live: 'Live',
  draft: 'Draft',
}

export function StatusPill({ status }: { status: string }) {
  const key = status.toLowerCase()
  return (
    <span className={STATUS_CLASS[key] || 'pill pill-draft'}>
      {STATUS_LABEL[key] || status}
    </span>
  )
}
