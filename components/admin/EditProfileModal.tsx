'use client'
import React, { useState, useEffect } from 'react'
import { X, Save, Camera, User, Phone, Calendar } from 'lucide-react'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  member: any
  onSuccess: () => void
}

export default function EditProfileModal({ isOpen, onClose, member, onSuccess }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    avatar_url: '',
    bio: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state with member props when modal opens or member updates
  useEffect(() => {
    if (isOpen && member) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        phone: member.phone || member.phone_number || '',
        date_of_birth: member.date_of_birth || '',
        avatar_url: member.avatar_url || member.profile_photo_url || '',
        bio: member.bio || ''
      })
    }
  }, [isOpen, member])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/staff/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg text-white">
                <User size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Edit My Profile</h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Personal Information</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">First Name</label>
                <input 
                  type="text"
                  value={formData.first_name}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm"
                  required
                />
             </div>
             <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Last Name</label>
                <input 
                  type="text"
                  value={formData.last_name}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm"
                  required
                />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Phone Number</label>
             <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm"
                  placeholder="+233..."
                />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Date of Birth</label>
             <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="date"
                  value={formData.date_of_birth}
                  onChange={e => setFormData({...formData, date_of_birth: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm"
                />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Profile Photo URL</label>
             <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="url"
                  value={formData.avatar_url}
                  onChange={e => setFormData({...formData, avatar_url: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm"
                  placeholder="https://..."
                />
             </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Biography</label>
             <textarea 
               value={formData.bio}
               onChange={e => setFormData({...formData, bio: e.target.value})}
               className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none transition-all font-bold text-sm min-h-[100px] resize-y"
               placeholder="Write a short professional bio..."
             />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
             <button 
               type="button"
               onClick={onClose}
               className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-all"
               disabled={isSaving}
             >
               Cancel
             </button>
             <button 
               type="submit"
               disabled={isSaving}
               className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
             >
               {isSaving ? (
                 <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                 <Save size={16} />
               )}
               <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
             </button>
          </div>
        </form>
      </div>
    </div>
  )
}
