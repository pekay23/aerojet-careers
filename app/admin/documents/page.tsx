import AdminLayout from '@/components/admin/AdminLayout'
import FileManagement from '@/components/admin/FileManagement'
import { FolderOpen } from 'lucide-react'

export const metadata = {
  title: 'Documents | Aerojet Portal',
}

export default function DocumentsPage() {
  return (
    <AdminLayout title="File Management">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2 px-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                <FolderOpen size={20} />
             </div>
             <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">File Management</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manage company documents and employee records.</p>
             </div>
          </div>
        </div>

        <FileManagement />
      </div>
    </AdminLayout>
  )
}
