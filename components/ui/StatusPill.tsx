import React from 'react'

const STATUS_CLASS: Record<string, string> = {
  new:               'bg-blue-50 text-blue-600 border-blue-100',
  under_review:      'bg-amber-50 text-amber-600 border-amber-100',
  shortlisted:       'bg-emerald-50 text-emerald-600 border-emerald-100',
  interview:         'bg-purple-50 text-purple-600 border-purple-100',
  offer:             'bg-indigo-50 text-indigo-600 border-indigo-100',
  hired:             'bg-green-50 text-green-600 border-green-100',
  rejected:          'bg-rose-50 text-rose-600 border-rose-100',
  transferred_to_hr: 'bg-slate-100 text-slate-600 border-slate-200',
  withdrawn:         'bg-slate-50 text-slate-400 border-slate-100',
  open:              'bg-emerald-50 text-emerald-600 border-emerald-100',
  draft:             'bg-slate-50 text-slate-500 border-slate-200',
  closed:            'bg-rose-50 text-rose-600 border-rose-100',
  paused:            'bg-amber-50 text-amber-600 border-amber-100',
  filled:            'bg-green-50 text-green-600 border-green-100',
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest border ${STATUS_CLASS[status.toLowerCase()] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {STATUS_LABEL[status.toLowerCase()] || status}
    </span>
  )
}
