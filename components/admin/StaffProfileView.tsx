'use client'

import React, { useState } from 'react'
import { 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Shield, 
  Clock, 
  Edit3,
  Camera,
  CheckCircle2,
  Folder,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import FileManagement from './FileManagement'
import EditProfileModal from './EditProfileModal'
import { useRouter } from 'next/navigation'

export interface MemberViewData {
  id?: string
  staff_profile_id?: string
  role?: string
  status?: string
  full_name: string
  job_title?: string
  department?: string
  personal_email?: string
  phone_number?: string
  profile_photo_url?: string
  hire_date?: string
  date_of_birth?: string
  bio?: string
  created_at: string
}

interface StaffProfileProps {
  member: MemberViewData
  isOwnProfile?: boolean
}

export default function StaffProfileView({ member }: StaffProfileProps) {
  const [activeTab, setActiveTab] = useState('Personal')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const router = useRouter()

  const tabs = ['Personal', 'Job', 'Time Off', 'Documents', 'Notes']

  return (
    <div className="space-y-8">
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={member}
        onSuccess={() => router.refresh()}
      />

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
           <button 
             onClick={() => setIsEditModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
           >
             <Edit3 size={14} />
             <span>Edit Profile</span>
           </button>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative group">
            <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-2xl shadow-blue-500/20">
              <div className="h-full w-full rounded-xl bg-white flex items-center justify-center text-4xl font-bold text-blue-600 uppercase overflow-hidden relative">
                {member.profile_photo_url ? (
                  <img src={member.profile_photo_url} className="h-full w-full object-cover" alt="Profile" sizes="(max-width: 768px) 128px, 128px" />
                ) : (
                  member.full_name?.[0] || '?'
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                   <Camera className="text-white" size={24} />
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white h-8 w-8 rounded-full flex items-center justify-center text-white shadow-lg">
               <CheckCircle2 size={14} />
            </div>
          </div>

          <div className="text-center md:text-left pt-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2 uppercase">{member.full_name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
               <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-widest uppercase">
                 {member.job_title}
               </span>
               <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold tracking-widest uppercase">
                 {member.department}
               </span>
               <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 ml-2">
                 <MapPin size={14} />
                 <span>Aerojet Accra Base, Ghana</span>
               </div>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <div className="flex items-center gap-8 mt-12 border-b border-slate-100 overflow-x-auto scrollbar-hide">
           {tabs.map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={cn(
                 "pb-4 text-xs font-bold tracking-widest uppercase transition-all relative",
                 activeTab === tab ? "text-blue-600" : "text-slate-600 hover:text-slate-800"
               )}
             >
               {tab}
               {activeTab === tab && (
                 <motion.div 
                   layoutId="activeTab"
                   className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" 
                 />
               )}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-8">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeTab}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.2 }}
             >
               {activeTab === 'Personal' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard label="Personal Email" value={member.personal_email} icon={Mail} />
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">Work Email</p>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <Shield size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{member.full_name?.toLowerCase().replace(' ', '.')}@aerojet-aviation.com</span>
                      </div>
                    </div>
                    <InfoCard label="Phone Number" value={member.phone_number || 'N/A'} icon={Phone} />
                    <InfoCard label="Date of Birth" value={member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString() : 'N/A'} icon={Calendar} />
                    
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                       <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3 text-left">Biography</p>
                       <div className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap text-left">
                         {member.bio || 'No biography provided.'}
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'Job' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoCard label="Job Title" value={member.job_title} icon={Briefcase} />
                    <InfoCard label="Department" value={member.department} icon={Users} />
                    <InfoCard label="Hire Date" value={member.hire_date ? new Date(member.hire_date).toLocaleDateString() : 'N/A'} icon={Clock} />
                    <InfoCard label="Employment Status" value={member.status || 'Active'} icon={CheckCircle2} color="emerald" />
                 </div>
               )}
               
               {activeTab === 'Documents' && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm"
                 >
                    <div className="flex items-center gap-3 mb-8">
                       <div className="p-2 bg-blue-600 rounded-lg text-white">
                          <Folder size={20} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 uppercase">Profile Documents</h3>
                    </div>
                    <FileManagement staffId={member.staff_profile_id || member.id} />
                 </motion.div>
               )}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* Right Column: Quick Stats / Meta */}
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm font-sans">
              <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase mb-6 flex items-center gap-2">
                <Clock size={14} /> Account Activity
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Member Since</span>
                    <span className="font-bold text-slate-900 uppercase">{new Date(member.created_at).getFullYear()}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Role</span>
                    <span className="font-bold text-blue-600 uppercase tracking-tighter">{member.role}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">Access Level</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold uppercase">Standard</span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-xl text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group h-40 flex flex-col justify-end">
              <Shield className="absolute top-0 right-0 -mr-4 -mt-4 h-32 w-32 text-white/10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 mb-1">Upcoming Review</p>
              <p className="text-xl font-bold truncate uppercase">Quarterly Check-in</p>
              <p className="text-xs font-bold opacity-80">{new Date().toLocaleDateString()}</p>
           </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon: Icon, color = 'blue' }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-3">{label}</p>
      <div className="flex items-center gap-3">
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center",
          color === 'blue' && "bg-blue-50 text-blue-600",
          color === 'emerald' && "bg-emerald-50 text-emerald-600",
        )}>
          <Icon size={16} />
        </div>
        <span className="text-base font-bold text-slate-900 truncate">{value}</span>
      </div>
    </div>
  )
}
