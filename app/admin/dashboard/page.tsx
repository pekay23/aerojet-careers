import AdminLayout from '@/components/admin/AdminLayout'
import DashboardStats from '@/components/admin/DashboardStats'
import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  ArrowRight, 
  PlusCircle, 
  MapPin, 
  Calendar,
  Zap,
  Briefcase,
  FileText
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard | Aerojet Staff Portal',
}

export default async function AdminDashboardPage() {
  // Use direct server-side fetching instead of a self-referencing fetch call
  const fetchCount = async (table: string, filter?: { col: string; val: any }) => {
    try {
      let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
      if (filter) q = q.eq(filter.col, filter.val)
      if (table === 'applications') q = q.is('deleted_at', null)
      const { count, error } = await q
      if (error) throw error
      return count || 0
    } catch (e) {
      console.error(`Dashboard direct count failed for ${table}:`, e)
      return 0
    }
  }

  const [
    activeJobs,
    totalJobs,
    totalCandidates,
    talentPoolCount,
    newApplications,
    hiredCount,
    settingsRes
  ] = await Promise.all([
    fetchCount('jobs', { col: 'status', val: 'open' }),
    fetchCount('jobs'),
    fetchCount('applications'),
    fetchCount('talent_pool'),
    fetchCount('applications', { col: 'status', val: 'new' }),
    fetchCount('applications', { col: 'status', val: 'hired' }),
    supabaseAdmin.from('system_settings').select('setting_key, setting_value')
  ])

  const stats = {
    activeJobs,
    totalJobs,
    totalCandidates,
    talentPoolCount,
    newApplications,
    hiredCount
  }

  const sMap: Record<string, string> = {}
  if (settingsRes.data) {
    settingsRes.data.forEach((s: any) => sMap[s.setting_key] = s.setting_value)
  }

  const { data: recentApps } = await supabaseAdmin
    .from('applications')
    .select('*, job:jobs(title, department)')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-10 font-sans">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
               <h2 className="text-[9px] font-bold tracking-[0.3em] text-blue-600 uppercase">{sMap.company_name || 'Aerojet Aviation Group'}</h2>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase leading-none">Dashboard</h1>
               <p className="text-xs font-medium text-slate-400">Welcome back. Here is an overview of current portal activity.</p>
            </div>
           
           <div className="flex items-center gap-3">
               <Link
                 href="/admin/jobs?action=new"
                 className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-bold transition-all shadow-sm uppercase tracking-widest"
               >
                 <PlusCircle size={16} />
                 <span>New Posting</span>
               </Link>
           </div>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Recent Applications Listing */}
           <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">Recent Applications</h3>
                 <Link href="/admin/applications" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">View All</Link>
              </div>
              
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                 <div className="divide-y divide-slate-50">
                    {recentApps?.map((app) => (
                      <div key={app.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all text-[10px]">
                               {app.first_name[0]}{app.last_name[0]}
                            </div>
                            <div>
                               <Link href={`/admin/applications/${app.id}`} className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors uppercase tracking-tight">
                                 {app.first_name} {app.last_name}
                               </Link>
                               <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span className="text-blue-600">{app.job?.title}</span>
                                  <span>•</span>
                                  <span>{new Date(app.created_at).toLocaleDateString()}</span>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                             <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                                (app.status || '').toLowerCase() === 'new' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                             )}>
                                {app.status}
                             </span>
                            <Link href={`/admin/applications/${app.id}`} className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                               <ArrowRight size={18} />
                            </Link>
                         </div>
                      </div>
                    ))}
                    {(!recentApps || recentApps.length === 0) && (
                      <div className="p-12 text-center text-slate-400 font-bold text-sm">
                         No recent applications found.
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Quick Actions / Shortcuts */}
            <div className="space-y-6">
               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-6">Quick Actions</h3>
                  <div className="space-y-3">
                     <ShortcutLink href="/admin/applications?view=pipeline" label="Selection Process" icon={Zap} color="amber" />
                     <ShortcutLink href="/admin/documents" label="Manage Files" icon={FileText} color="blue" />
                     <ShortcutLink href="/admin/jobs" label="Review Listings" icon={Briefcase} color="indigo" />
                  </div>
              </div>

               <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="relative z-10">
                     <p className="text-[9px] font-bold tracking-[0.3em] text-blue-600 uppercase mb-2">System Status</p>
                     <h4 className="text-xl font-bold uppercase mb-1 text-slate-900">{sMap.portal_status || 'Operational'}</h4>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                        <MapPin size={12} />
                        <span>{sMap.base_location || 'Accra Base, GH'}</span>
                     </div>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform flex items-center justify-center h-32 w-48 grayscale brightness-0">
                     <img src={sMap.enterprise_logo_url || "/images/aalogo-TUj_x_h8.png"} className="h-full w-auto object-contain" alt="Logo" />
                  </div>
               </div>
           </div>
        </div>

      </div>
    </AdminLayout>
  )
}

function ShortcutLink({ href, label, icon: Icon, color }: any) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-400 hover:bg-white hover:shadow-sm transition-all group"
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        color === 'amber' && "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
        color === 'blue' && "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white",
        color === 'indigo' && "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
      )}>
        <Icon size={16} />
      </div>
      <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-tight">{label}</span>
    </Link>
  )
}
