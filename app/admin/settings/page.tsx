'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Save, 
  Building2, 
  MapPin, 
  Mail, 
  Activity,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  UploadCloud,
  Plus,
  Trash2,
  Table as TableIcon,
  RotateCcw,
  Shield,
  Palette,
  History,
  Smartphone,
  ChevronRight,
  User,
  Zap,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'branding' | 'intelligence'>('config')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Data State
  const [settings, setSettings] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [manualSnapshots, setManualSnapshots] = useState<any[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)
  
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const json = await res.json()
      if (json.data) setSettings(json.data)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch('/api/admin/audit?limit=30')
      const json = await res.json()
      if (json.data) setAuditLogs(json.data)
    } finally {
      setLoadingLogs(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'intelligence') fetchAuditLogs()
  }, [activeTab])

  const handleUpdate = (key: string, value: string) => {
    setSettings(prev => {
      const exists = prev.find(s => s.setting_key === key)
      if (exists) return prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s)
      return [...prev, { setting_key: key, setting_value: value }]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const payload = settings.map(s => ({ key: s.setting_key, value: s.setting_value }))
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully.' })
        setTimeout(() => setMessage(null), 3000)
      } else throw new Error('Failed to save settings. Please try again.')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (key: string) => settings.find(s => s.setting_key === key)?.setting_value || ''

  const TABS = [
    { id: 'config', label: 'Configuration', icon: Shield },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'intelligence', label: 'Activity Log', icon: History },
  ] as const

  return (
    <AdminLayout title="System Hub">
      <div className="max-w-5xl mx-auto space-y-12 font-sans pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-2">
              <h2 className="text-[9px] font-bold tracking-[0.4em] text-blue-600 uppercase flex items-center gap-2">
                <span className="w-6 h-px bg-blue-600" /> Administrative Core
              </h2>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">System Settings</h1>
              <p className="text-xs font-medium text-slate-400">Manage settings, company branding, and recent system updates.</p>
           </div>
           
           <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-slate-900 shadow-xl shadow-slate-200/50" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        {message && (
          <div className={cn(
            "p-5 rounded-2xl flex items-center gap-4 text-sm font-bold border animate-in fade-in slide-in-from-top-4",
            message.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
          )}>
            {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            {message.text}
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'config' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
               
               {/* Core Config */}
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Building2 size={24} /></div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Company Details</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Profile</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Company Legal Name</label>
                        <input 
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                          value={getSetting('company_name')}
                          onChange={(e) => handleUpdate('company_name', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Support & Admin Email</label>
                        <div className="relative">
                           <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                             className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-slate-900"
                             value={getSetting('support_email')}
                             onChange={(e) => handleUpdate('support_email', e.target.value)}
                           />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Portal Health indicator */}
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
                  <Activity size={180} className="absolute right-[-30px] top-[-30px] text-slate-50 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
                  
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Activity size={24} /></div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Portal Status</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live health indicator</p>
                     </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Broadcasting Message</label>
                        <input 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-bold text-slate-900 text-xl uppercase tracking-[0.05em]"
                          value={getSetting('portal_status')}
                          onChange={(e) => handleUpdate('portal_status', e.target.value)}
                        />
                     </div>
                     <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold tracking-[0.1em] text-emerald-600 uppercase">Connected • Live updates active</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
               
               {/* Color & Theme */}
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Palette size={24} /></div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">System Branding</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Theme & Colors</p>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Primary Brand Color</label>
                        <div className="flex items-center gap-6">
                           <div className="h-20 w-32 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden flex items-center justify-center bg-slate-50">
                              <div 
                                className="absolute inset-0 transition-colors duration-500" 
                                style={{ backgroundColor: getSetting('brand_primary_color') || '#2880b9' }} 
                              />
                              <input 
                                type="color" 
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                value={getSetting('brand_primary_color') || '#2880b9'}
                                onChange={(e) => handleUpdate('brand_primary_color', e.target.value)}
                              />
                              <span className="relative z-10 text-[10px] font-black text-white drop-shadow-md uppercase tracking-[0.2em]">Select Color</span>
                           </div>
                           <div className="flex-1 space-y-2">
                              <input 
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-mono font-bold text-slate-900 uppercase"
                                value={getSetting('brand_primary_color') || '#2880b9'}
                                onChange={(e) => handleUpdate('brand_primary_color', e.target.value)}
                              />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">This color will be applied to buttons, active navigation, and accents.</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-slate-50">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Corner Accent Radius</label>
                        <div className="flex items-center gap-6">
                           <div className="flex-1">
                              <input 
                                type="range" 
                                min="0" max="32" step="4"
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={getSetting('brand_accent_radius') || '12'}
                                onChange={(e) => handleUpdate('brand_accent_radius', e.target.value)}
                              />
                           </div>
                           <div className="w-16 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs font-bold text-slate-900">
                              {getSetting('brand_accent_radius') || '12'}px
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Assets */}
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ImageIcon size={24} /></div>
                     <div className="space-y-1">
                        <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Asset Library</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo & Iconography</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-2">Enterprise Logo URL</label>
                        <div className="relative">
                           <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                             className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-bold text-slate-900"
                             value={getSetting('enterprise_logo_url')}
                             onChange={(e) => handleUpdate('enterprise_logo_url', e.target.value)}
                           />
                        </div>
                        <div className="mt-6 h-32 w-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center p-6 grayscale hover:grayscale-0 transition-all group">
                           {getSetting('enterprise_logo_url') ? (
                             <img src={getSetting('enterprise_logo_url')} className="h-full w-auto object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" alt="Preview" />
                           ) : (
                             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Logo Preview</p>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8">
               
               {/* Global Intelligence Feed */}
               <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><History size={24} /></div>
                        <div className="space-y-1">
                           <h3 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Activity History</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent actions and process updates</p>
                        </div>
                     </div>
                     <button 
                       onClick={fetchAuditLogs}
                       disabled={loadingLogs}
                       className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                     >
                        <RotateCcw size={18} className={cn(loadingLogs && "animate-spin")} />
                     </button>
                  </div>

                  <div className="p-2 overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-white">
                              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Action Category</th>
                              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Description</th>
                              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">Initiated By</th>
                              <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50 text-right">Timestamp</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                           {loadingLogs ? (
                             [...Array(5)].map((_, i) => (
                               <tr key={i} className="animate-pulse">
                                  <td colSpan={4} className="px-8 py-6 h-16 bg-slate-50/20" />
                               </tr>
                             ))
                           ) : auditLogs.length === 0 ? (
                             <tr>
                                <td colSpan={4} className="px-8 py-20 text-center">
                                   <Database size={40} className="mx-auto text-slate-100 mb-4" />
                                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No activity recorded yet.</p>
                                </td>
                             </tr>
                           ) : auditLogs.map((log) => (
                             <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-8 py-5">
                                   <div className={cn(
                                     "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest border",
                                     log.event_type === 'system_update' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                     log.event_type === 'status_change' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                     "bg-slate-50 text-slate-600 border-slate-200"
                                   )}>
                                      <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]",
                                        log.event_type === 'system_update' ? "bg-blue-600" :
                                        log.event_type === 'status_change' ? "bg-emerald-500" : "bg-slate-400"
                                      )} />
                                      {log.event_type === 'system_update' ? 'System Config' : log.event_type?.replace(/_/g, ' ')}
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <p className="text-xs font-bold text-slate-900 uppercase tracking-tight line-clamp-1">{log.note || 'Manual Process Record'}</p>
                                   <div className="flex gap-2 mt-1">
                                      {log.from_status && <span className="text-[8px] font-bold text-slate-300 line-through uppercase">{log.from_status}</span>}
                                      {log.to_status && <ChevronRight size={8} className="text-slate-200 self-center" />}
                                      {log.to_status && <span className="text-[8px] font-extrabold text-blue-500 uppercase">{log.to_status}</span>}
                                   </div>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-[10px] font-black uppercase">
                                         <User size={14} />
                                      </div>
                                      <div className="flex flex-col">
                                         <span className="text-[10px] font-bold text-slate-900 uppercase tracking-tight">{log.admin?.full_name || 'System Service'}</span>
                                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{log.admin?.email || 'Automated Process'}</span>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <div className="flex flex-col items-end">
                                      <span className="text-[10px] font-bold text-slate-900 flex items-center gap-1.5 leading-none">
                                         <Clock size={12} className="text-slate-200" />
                                         {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                                         {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </span>
                                   </div>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Integrated Action Bar */}
        <div className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-100 rounded-3xl shadow-sm mt-8 border-dashed">
           <div className="flex items-center gap-3 pl-2">
              <div className="h-8 w-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                 <Save size={16} />
              </div>
              <div>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Update System</p>
                 <p className="text-[10px] font-bold text-slate-900 uppercase tracking-tight mt-1">Ready to save changes</p>
              </div>
           </div>

           <button 
             onClick={handleSave}
             disabled={saving || loading}
             className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-2xl text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
           >
              {saving ? <Loader2 size={14} className="animate-spin text-blue-400" /> : <Zap size={14} className="text-blue-400 fill-blue-400" />}
              {saving ? 'Saving…' : 'Save Changes'}
           </button>
        </div>

      </div>
    </AdminLayout>
  )
}
