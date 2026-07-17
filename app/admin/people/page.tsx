import AdminLayout from '@/components/admin/AdminLayout'
import PeopleDirectory from '@/components/admin/PeopleDirectory'
import { Plus } from 'lucide-react'

export const metadata = {
  title: 'Staff Directory | Aerojet Portal',
}

export default function PeoplePage() {
  return (
    <AdminLayout title="Team">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 uppercase">Aerojet Team</h2>
            <p className="text-sm font-bold text-slate-400">View and manage all staff members and portal administrators.</p>
          </div>
        </div>

        <PeopleDirectory />
      </div>
    </AdminLayout>
  )
}
