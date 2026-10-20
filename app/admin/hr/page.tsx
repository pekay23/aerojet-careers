'use client'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { toast } from '@/lib/toast'
import type { Application } from '@/types'

const PLATFORMS = [
  { value: 'bamboohr',  label: 'BambooHR',          sub: 'Connect directly to your BambooHR account' },
  { value: 'workday',   label: 'Workday',            sub: 'Send records to your Workday HR system' },
  { value: 'csv',       label: 'CSV Export',         sub: 'Download data as a spreadsheet file' },
  { value: 'custom',    label: 'Custom / Webhook',   sub: 'Send to Zapier or a custom integration' },
]

export default function HRPage() {
  const [apps,      setApps]      = useState<Application[]>([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<string[]>([])
  const [platform,  setPlatform]  = useState('csv')
  const [pushing,   setPushing]   = useState(false)
  const [, setResult]    = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    fetch('/api/admin/applications?status=hired&limit=100')
      .then(r => r.json())
      .then(d => { setApps(d.data || []); setLoading(false) })
  }, [])

  const toggleAll = (checked: boolean) => setSelected(checked ? apps.map(a => a.id) : [])
  const toggle    = (id: string)       => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const exportCSV = () => {
    const sel  = selected.length > 0 ? apps.filter(a => selected.includes(a.id)) : apps
    const rows = [
      ['Ref','First Name','Last Name','Email','Phone','Nationality','Country','Role','Licence','Type Ratings','Min Salary USD','Target Salary USD','Start Date','Status'],
      ...sel.map(a => [
        a.ref_code, a.first_name, a.last_name, a.email, a.phone,
        a.nationality, a.country_of_residence, a.job_title || 'General',
        a.qualifications?.licence_type || '',
        (a.qualifications?.type_ratings || []).join('; '),
        a.compensation?.expected_min_usd || '',
        a.compensation?.expected_target_usd || '',
        a.compensation?.earliest_start_date || '',
        a.status,
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const el  = document.createElement('a')
    el.href   = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    el.download = `aerojet-hr-export-${new Date().toISOString().slice(0,10)}.csv`
    el.click()
  }

  const push = async () => {
    if (selected.length === 0) { toast.error('Please select at least one candidate to export.'); return }
    setPushing(true); setResult(null)
    const r = await fetch('/api/hr/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_ids: selected, platform }),
    })
    const d = await r.json()
    const success = (d.results || []).filter((x: any) => x.status === 'success').length
    const failed  = (d.results || []).filter((x: any) => x.status !== 'success').length
    setResult({ success, failed })
    setPushing(false)
  }

  return (
    <AdminLayout title="HR Export">
      <div className="space-y-6">
        {/* Platform selector */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-8 font-medium">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest leading-none">Export Destination</h2>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Select the target HR system for data transfer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`flex flex-col p-6 rounded-xl text-left border-2 transition-all group ${
                  platform === p.value 
                    ? 'bg-blue-50 border-blue-400 shadow-lg shadow-blue-400/10' 
                    : 'bg-slate-50 border-slate-50 hover:border-slate-200'
                }`}
              >
                <div className={`text-xs font-bold uppercase tracking-widest mb-2 transition-colors ${
                  platform === p.value ? 'text-blue-600' : 'text-slate-900'
                }`}>
                  {p.label}
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tight leading-relaxed group-hover:text-slate-800 transition-colors">
                  {p.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-50">
            <button 
              onClick={exportCSV} 
              className="flex-1 sm:flex-none px-8 py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
            >
              ↓ Download CSV
            </button>
            {platform !== 'csv' && (
              <button 
                onClick={push} 
                disabled={pushing || selected.length === 0} 
                className="flex-1 sm:flex-none px-10 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 disabled:shadow-none"
              >
                {pushing ? 'Sending…' : `→ Export ${selected.length || 0} Records`}
              </button>
            )}
          </div>
        </div>

        {/* Candidates table */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col font-medium">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Hired Candidates</h2>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Ready to export</p>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
               <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading records…</p>
            </div>
          ) : apps.length === 0 ? (
            <div className="py-24 text-center space-y-4 px-8">
               <div className="text-4xl opacity-10 grayscale">👥</div>
               <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">No hired staff records are available for export yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-4 lg:px-8 py-4 border-b border-slate-100">
                      <input 
                        type="checkbox" 
                        onChange={e => toggleAll(e.target.checked)} 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                      />
                    </th>
                    {['Candidate','Role','Nationality','Start Date'].map(h => (
                      <th key={h} scope="col" className="px-4 lg:px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {apps.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 lg:px-8 py-5">
                        <input 
                          type="checkbox" 
                          checked={selected.includes(a.id)} 
                          onChange={() => toggle(a.id)} 
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                        />
                      </td>
                      <td className="px-4 lg:px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{a.first_name} {a.last_name}</span>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{a.email}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-5 text-[11px] uppercase tracking-tight text-slate-600">{a.job_title || 'General'}</td>
                      <td className="px-4 lg:px-8 py-5 text-[11px] uppercase tracking-widest text-slate-600">{a.nationality}</td>
                      <td className="px-4 lg:px-8 py-5 text-[11px] text-slate-600">{a.compensation?.earliest_start_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
