'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { StatusPill } from '@/components/ui/StatusPill'
import { toast } from '@/lib/toast'
import type { Application, RecruiterNote } from '@/types'
import { 
  User, 
  FileText, 
  GraduationCap, 
  Briefcase, 
  DollarSign, 
  Download,
  CheckCircle2,
  Clock,
  Mail,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react'

const STATUSES = ['new','under_review','shortlisted','interview','offer','hired','rejected','transferred_to_hr']

const STATUS_LABELS: Record<string, string> = {
  new: 'New Application',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview Stage',
  offer: 'Offer Extended',
  hired: 'Hired',
  rejected: 'Rejected',
  transferred_to_hr: 'Sent to HR',
}

export default function ApplicationDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const router     = useRouter()
  const [app,      setApp]      = useState<Application | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [noteFeed, setNoteFeed] = useState<RecruiterNote[]>([])
  const [draftNote, setDraftNote] = useState('')
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editBuffer, setEditBuffer] = useState('')
  const [currentUser, setCurrentUser] = useState('Recruiter')
  const [saving,   setSaving]   = useState(false)
  const [hiring,   setHiring]   = useState(false)
  const [hireSuccess, setHireSuccess] = useState<{ email: string, pass: string } | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) {
          setCurrentUser(user.email?.split('@')[0] || 'Recruiter')
        }
      })
      .catch(() => {})
    fetch(`/api/admin/application/${id}`)
      .then(r => r.json())
      .then(d => {
        setApp(d.data)
        
        // recruiter_notes is now a JSONB column — Supabase returns it as a native array.
        // Guard against legacy plain-text rows that predate migration 004.
        const raw = d.data?.recruiter_notes
        let parsed: RecruiterNote[] = []
        if (Array.isArray(raw)) {
          parsed = raw
        } else if (typeof raw === 'string' && raw.trim()) {
          // Legacy plain-text note — wrap it for display
          try {
            const attempt = JSON.parse(raw)
            parsed = Array.isArray(attempt) ? attempt : []
          } catch {
            parsed = [{ id: 'legacy-' + Date.now(), text: raw, author: 'Legacy Note', date: d.data.created_at }]
          }
        }
        setNoteFeed(parsed)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const [statusLoading, setStatusLoading] = useState(false)

  const syncNotes = async (newFeed: RecruiterNote[]) => {
    if (!app) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Send the array directly — the column is now JSONB, no need to stringify
        body: JSON.stringify({ id: app.id, recruiter_notes: newFeed }),
      })
      const body = await res.json()
      if (res.ok && body.success !== false) {
        setNoteFeed(newFeed)
        setApp(a => a ? { ...a, recruiter_notes: newFeed } : a)
        setDraftNote('')
        setEditingNoteId(null)
        toast.success('Note saved')
      } else {
        console.error('Notes save error:', body)
        toast.error('Failed to save note: ' + (body.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Notes network error:', err)
      toast.error('Network error — note not saved')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!app) return
    setStatusLoading(true)
    try {
       const res = await fetch('/api/admin/applications', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id: app.id, status: newStatus }),
       })
       const { success, error } = await res.json()
       if (success) {
         setApp(a => a ? { ...a, status: newStatus as typeof app.status } : a)
         toast.success('Status updated successfully')
       } else {
         toast.error(`Failed to update status: ${error}`)
       }
    } catch {
       toast.error('Network error while updating status.')
    } finally {
       setStatusLoading(false)
    }
  }

  const handleHire = async () => {
    if (!app) return
    if (!window.confirm(`Are you sure you want to officially hire ${app.first_name}? This will create their staff profile and login credentials.`)) return
    
    setHiring(true)
    try {
      const r = await fetch('/api/admin/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      })
      const d = await r.json()
      if (d.success) {
        setHireSuccess({ email: app.email, pass: d.data.tempPassword })
        setApp(a => a ? { ...a, status: 'hired' } : a)
        toast.success(`${app.first_name} has been hired successfully.`)
      } else {
        toast.error('Error: ' + (d.error || 'Could not complete the hire process.'))
      }
    } catch {
      toast.error('Connection error — please try again.')
    } finally {
      setHiring(false)
    }
  }

  if (loading) return (
    <AdminLayout title="Loading Application…">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest animate-pulse">Loading Details…</p>
      </div>
    </AdminLayout>
  )

  if (!app) return (
    <AdminLayout title="Application Not Found">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="text-6xl opacity-20 grayscale">👤</div>
        <div className="text-center space-y-2">
           <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Record Not Found</h2>
           <p className="text-xs font-medium text-slate-600">The requested application does not exist in our database.</p>
        </div>
        <Link href="/admin/applications" className="px-8 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all">
           Back to Applications
        </Link>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout title={`${app.first_name} ${app.last_name}`} breadcrumb={app.ref_code}>
      
      {/* Hiring Success Modal */}
      {hireSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500" />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl p-10 overflow-hidden animate-in zoom-in-95 duration-300 font-medium">
            {/* Success Animation Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 -mr-16 -mt-16 rounded-full" />
            
            <div className="relative text-center space-y-8">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 mx-auto transform hover:scale-110 transition-transform">
                <CheckCircle2 size={40} strokeWidth={2.5} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tighter leading-none">Recruitment Success</h2>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Candidate Successfully Hired</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-left space-y-6">
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">Login Email</label>
                   <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-900 truncate">{hireSuccess.email}</span>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(hireSuccess.email); }} 
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter hover:text-blue-700 transition-colors"
                      >
                         Copy
                      </button>
                   </div>
                 </div>
                 
                 <div className="space-y-1.5 pt-4 border-t border-slate-100">
                   <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">Temporary Password</label>
                   <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-emerald-600 font-mono tracking-widest">{hireSuccess.pass}</span>
                      <button 
                        onClick={() => { navigator.clipboard.writeText(hireSuccess.pass); }} 
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter hover:text-blue-700 transition-colors"
                      >
                         Copy
                      </button>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => router.push('/admin/people')} 
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1"
                >
                  View in Staff Directory
                </button>
                <button 
                  onClick={() => setHireSuccess(null)} 
                  className="w-full py-4 bg-white border border-slate-100 text-[10px] font-bold tracking-widest text-slate-600 hover:text-slate-900 transition-all uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Back button and navigation shortcut */}
      <div className="mb-6 flex items-center justify-between">
         <Link 
           href="/admin/applications" 
           className="group flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-blue-600 transition-colors"
         >
           <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
           Back to applications
         </Link>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 mb-10 font-medium">
        <div className="flex flex-col lg:flex-row justify-between items-start xl:items-center gap-10">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-2xl shadow-blue-500/20 ring-1 ring-blue-50">
              {app.first_name[0]}{app.last_name[0]}
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 uppercase tracking-tighter leading-none">{app.first_name} {app.last_name}</h1>
                <StatusPill status={app.status} />
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-8 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                <span className="flex items-center gap-2"><Briefcase size={14} className="text-blue-400" /> {app.job_title || 'General Application'}</span>
                <span className="flex items-center gap-2"><Clock size={14} className="text-blue-400" /> Submitted {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-blue-400" /> Ref: {app.ref_code}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <select
              value={app.status}
              onChange={e => updateStatus(e.target.value)}
              className="px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-blue-300 transition-all cursor-pointer appearance-none min-w-[180px]"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] || s.replace(/_/g, ' ')}</option>)}
            </select>
            
            <button 
              onClick={handleHire}
              disabled={hiring || app.status === 'hired'}
              className={`px-10 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3 ${
                app.status === 'hired' 
                  ? 'bg-slate-100 text-slate-600 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 active:scale-95'
              }`}
            >
              {hiring ? (
                <span className="flex items-center gap-2">
                   <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                   Processing…
                </span>
              ) : app.status === 'hired' ? '✓ Staff Member Added' : 'Hire as Staff'}
            </button>

          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-8 mt-12 border-b border-slate-100 relative overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', icon: User, label: 'Candidate Profile' },
            { id: 'qualifications', icon: GraduationCap, label: 'Qualifications' },
            { id: 'documents', icon: FileText, label: 'Attachments' },
            { id: 'notes', icon: CheckCircle2, label: 'Recruiter Notes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all shrink-0 border-b-2 ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-blue-600 -mb-[px] opacity-100' 
                  : 'text-slate-600 border-transparent hover:text-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <tab.icon size={16} /> 
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        
        {/* Main Information */}
        <div className="space-y-8 font-medium">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              <Section icon={User} title="Candidate Information">
                <Grid2>
                  <Detail label="Full Name" value={`${app.first_name} ${app.last_name}`} />
                  <Detail label="Email Address" value={app.email} icon={Mail} />
                  <Detail label="Phone Number" value={app.phone} icon={Smartphone} />
                  <Detail label="Nationality" value={app.nationality} />
                  <Detail label="Current Location" value={app.country_of_residence} />
                   <Detail label="Date of birth" value={app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                   <Detail label="Valid Passport" value={app.has_valid_passport === true ? 'Yes' : app.has_valid_passport === false ? 'No' : '—'} />
                  <Detail label="Availability" value={app.availability || 'Immediate'} />
                </Grid2>
              </Section>
              
              {app.compensation && (
                <Section icon={DollarSign} title="Salary Expectations">
                  <Grid2>
                    <Detail label="Targeted Salary (USD)" value={app.compensation.expected_target_usd ? `$${app.compensation.expected_target_usd.toLocaleString()}` : '—'} />
                    <Detail label="Minimum Expected (USD)" value={app.compensation.expected_min_usd ? `$${app.compensation.expected_min_usd.toLocaleString()}` : '—'} />
                    <Detail label="Payment Cycle" value={app.compensation.payment_preference || 'Monthly'} />
                    <Detail label="Earliest Start Date" value={app.compensation.earliest_start_date || '—'} />
                  </Grid2>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
              {app.experience && (
                <Section icon={Briefcase} title="Work Experience">
                  <Grid2>
                    <Detail label="Current Employer" value={app.experience.current_employer} />
                    <Detail label="Job Title" value={app.experience.job_title} />
                    <Detail label="Total Experience" value={`${app.experience.total_years_exp} Years`} />
                    <Detail label="Notice Period" value={app.experience.notice_period || 'None'} />
                  </Grid2>
                  <div className="mt-8 space-y-4">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Statement of Interest</div>
                    <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-8 rounded-xl border border-slate-100 font-bold">
                      {app.experience.motivation || 'No statement provided.'}
                    </div>
                  </div>
                </Section>
              )}

              {app.qualifications && (
                <Section icon={GraduationCap} title="License Details">
                  <Grid2>
                    <Detail label="License Type" value={app.qualifications.licence_type} />
                    <Detail label="License Number" value={app.qualifications.licence_number} />
                    <Detail label="Issuing Authority" value={app.qualifications.issuing_authority} />
                    <Detail label="License Expiry" value={app.qualifications.licence_expiry ? new Date(app.qualifications.licence_expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                  </Grid2>
                  <div className="mt-8 space-y-4">
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Type Ratings</div>
                    <div className="flex gap-2 flex-wrap">
                      {(app.qualifications.type_ratings || []).map((t: string) => (
                        <span key={t} className="px-6 py-2 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                           {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Section>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <Section icon={FileText} title="Attachments">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(app.documents || []).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-400/5 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <FileText size={24} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 uppercase tracking-tight truncate max-w-[120px]">{doc.file_name}</div>
                          <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{doc.document_type.replace(/_/g, ' ')} · {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : ''}</div>
                        </div>
                      </div>
                      <a
                        href={`/api/admin/download?path=${encodeURIComponent(doc.file_path)}&bucket=${doc.storage_bucket}`}
                        className="h-10 w-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"
                      >
                        <Download size={18} strokeWidth={2.5} />
                      </a>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <Section icon={CheckCircle2} title="Recruiter Notes">
                <div className="space-y-8">
                  {/* Notes Feed */}
                  <div className="space-y-6">
                     {noteFeed.length === 0 ? (
                        <div className="text-sm font-bold text-slate-600 py-10 text-center uppercase tracking-widest border border-dashed border-slate-200 rounded-xl bg-slate-50">No notes recorded yet.</div>
                     ) : (
                        noteFeed.map(note => (
                           <div key={note.id} className="p-6 bg-slate-50 border border-slate-100 rounded-xl space-y-4 shadow-sm group">
                              <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{note.author}</span>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{new Date(note.date).toLocaleString()}</span>
                                 </div>
                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingNoteId(note.id); setEditBuffer(note.text); }} className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={() => { if(confirm('Delete this note?')) syncNotes(noteFeed.filter(x => x.id !== note.id)) }} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                 </div>
                              </div>
                              
                              {editingNoteId === note.id ? (
                                 <div className="space-y-3">
                                    <textarea
                                       value={editBuffer}
                                       onChange={e => setEditBuffer(e.target.value)}
                                       className="w-full min-h-[100px] p-4 bg-white border border-blue-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                    <div className="flex items-center gap-2 justify-end">
                                       <button onClick={() => setEditingNoteId(null)} className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-900">Cancel</button>
                                       <button onClick={() => syncNotes(noteFeed.map(x => x.id === note.id ? { ...x, text: editBuffer } : x))} disabled={saving} className="px-4 py-2 bg-blue-600 text-[10px] font-bold text-white uppercase tracking-widest rounded hover:bg-slate-900 transition-colors">Save Changes</button>
                                    </div>
                                 </div>
                              ) : (
                                 <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{note.text}</div>
                              )}
                           </div>
                        ))
                     )}
                  </div>
                  
                  {/* Add New Note */}
                  <div className="pt-8 border-t border-slate-100 space-y-4">
                     <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">Add a Note</label>
                     <textarea
                       value={draftNote}
                       onChange={e => setDraftNote(e.target.value)}
                       placeholder="Write your note here..."
                       className="w-full min-h-[140px] p-6 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-slate-50 focus:border-blue-400 focus:outline-none transition-all"
                     />
                     <div className="flex justify-end">
                       <button 
                         onClick={() => {
                           if (!draftNote.trim()) return;
                           const nw = { id: 'note-' + Date.now(), text: draftNote, author: currentUser, date: new Date().toISOString() };
                           syncNotes([...noteFeed, nw]);
                         }} 
                         disabled={saving || !draftNote.trim()}
                         className="px-8 py-3.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
                       >
                         {saving ? 'Saving…' : <><Plus size={14} /> Save Note</>}
                       </button>
                     </div>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8 font-medium sticky top-24">
          <div className="bg-slate-900 rounded-xl p-10 text-white shadow-2xl shadow-slate-900/30 border border-slate-800 space-y-8">
            <h3 className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] border-b border-white/5 pb-4 leading-none">Quick Actions</h3>
            <div className="space-y-6">
              {[
                { label: 'Experience', value: (app.experience?.total_years_exp || '0') + ' Years' },
                { label: 'Availability', value: app.availability || 'Immediate' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center text-[11px] uppercase tracking-tighter">
                  <span className="text-slate-500 font-bold">{item.label}</span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
               <button 
                onClick={() => updateStatus('shortlisted')}
                disabled={statusLoading || app.status === 'shortlisted'}
                className="w-full py-4 rounded-lg border-2 border-slate-700 hover:border-blue-500 hover:text-blue-400 text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {statusLoading ? 'Updating…' : app.status === 'shortlisted' ? '✓ Shortlisted' : 'Move to Shortlist'}
               </button>
               <button 
                onClick={() => updateStatus('rejected')}
                disabled={statusLoading || app.status === 'rejected'}
                className="w-full py-4 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/20 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {statusLoading ? 'Updating…' : app.status === 'rejected' ? '✓ Rejected' : 'Reject Applicant'}
               </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
            <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.3em] border-b border-slate-50 pb-4">Application Info</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Source</div>
                <div className="text-xs font-bold text-slate-900 uppercase">{app.source || 'Direct Application'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Attachments</div>
                <div className="text-xs font-bold text-slate-900 uppercase">{(app.documents || []).length} Files</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
           <Icon size={24} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tighter leading-none">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function Detail({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-50 hover:border-blue-100 transition-all group">
      <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3">{label}</div>
      <div className="flex items-center gap-3 text-sm font-bold text-slate-900 uppercase tracking-tight transition-colors group-hover:text-blue-600">
        {Icon && <Icon size={16} className="text-blue-400" />}
        {value || '—'}
      </div>
    </div>
  )
}
