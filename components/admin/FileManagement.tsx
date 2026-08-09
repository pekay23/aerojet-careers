'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Folder, 
  File as FileIcon, 
  Upload, 
  ChevronRight, 
  Search,
  Trash2,
  Download,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface File {
  id: string
  file_name: string
  file_url: string
  file_type: string
  file_size?: number
  created_at: string
  folder_id: string
  is_external?: boolean
}

interface Folder {
  id: string
  name: string
  description?: string
}

export default function FileManagement({ 
  staffId, 
  viewOnly = false 
}: { 
  staffId?: string, 
  viewOnly?: boolean 
}) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [filePage, setFilePage] = useState(1)
  const [fileTotal, setFileTotal] = useState(0)
  const fileLimit = 50
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (currentFolder) {
      fetchFiles(currentFolder.id)
    }
  }, [currentFolder])

  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/folders')
      const data = await res.json()
      if (data.success) {
        setFolders(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFiles = async (folderId: string) => {
    try {
       const url = staffId 
         ? `/api/admin/documents?folderId=${folderId}&staffId=${staffId}&page=${filePage}&limit=${fileLimit}`
         : `/api/admin/documents?folderId=${folderId}&page=${filePage}&limit=${fileLimit}`
      
       const res = await fetch(url)
       const data = await res.json()
       if (data.success) {
         const d = data.data
         setFiles(d.data || d || [])
         setFileTotal(d.total || 0)
       }
    } catch (err: any) {
      console.error('Error fetching files:', err)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentFolder || !staffId) return

    setIsUploading(true)
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${staffId}/${currentFolder.name}/${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('staff-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('staff-documents')
        .getPublicUrl(fileName)

      // 2. Register in Database via API
      const res = await fetch('/api/admin/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: staffId,
          folder_id: currentFolder.id,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size
        })
      })

      const dbData = await res.json()
      if (dbData.success) {
        setFiles(prev => [dbData.data, ...prev])
      } else {
        throw new Error(dbData.error)
      }

    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await fetch(`/api/admin/documents?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setFiles(prev => prev.filter(f => f.id !== id))
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`)
    }
  }

  const filteredFolders = folders.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
      />

      {/* Search & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search folders or files..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {!viewOnly && currentFolder && (
            <button 
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 uppercase tracking-widest"
            >
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-bold">
        <button 
          onClick={() => setCurrentFolder(null)}
          className={cn("hover:text-blue-600 transition-colors uppercase tracking-widest", !currentFolder ? "text-blue-600" : "text-slate-400")}
        >
          Portal Files
        </button>
        {currentFolder && (
          <>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-blue-600 uppercase tracking-widest">{currentFolder.name}</span>
          </>
        )}
      </nav>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentFolder?.id || 'root'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
               <Loader2 className="animate-spin mb-4" size={32} />
               <p className="font-bold text-sm uppercase tracking-widest">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-100 p-8 rounded-xl text-center text-red-600">
               <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold uppercase tracking-widest text-xs mb-2">Error Loading Documents</p>
               <p className="text-sm font-bold">{error}</p>
            </div>
          ) : (
            <>
              {/* Folders View */}
              {!currentFolder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolder(folder)}
                      className="group flex flex-col items-start p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left relative overflow-hidden"
                    >
                      <div className="p-3 bg-blue-50 rounded-lg text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Folder size={24} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-tight">{folder.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed truncate w-full">
                        {folder.description || 'View contents'}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Files View */}
              {currentFolder && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Documents</th>
                        <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Uploaded</th>
                        <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-500 uppercase">Size</th>
                        <th className="px-6 py-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {files.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center text-slate-400">
                              <FileText size={48} className="mb-4 opacity-20" />
                              <p className="font-bold text-sm uppercase tracking-widest">No documents in this folder</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        files.map((file) => (
                          <tr key={file.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                  <FileIcon size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{file.file_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(file.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {(file.file_size || 0) > 1024 * 1024 
                                  ? `${((file.file_size || 0) / (1024 * 1024)).toFixed(1)} MB` 
                                  : `${((file.file_size || 0) / 1024).toFixed(0)} KB`}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 pr-2">
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                >
                                  <Download size={16} />
                                </a>
                                 {!viewOnly && !file.is_external && (
                                  <button 
                                    onClick={() => handleDelete(file.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* File Pagination */}
                  {currentFolder && fileTotal > fileLimit && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Showing {((filePage - 1) * fileLimit) + 1} to {Math.min(filePage * fileLimit, fileTotal)} of {fileTotal} files
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilePage(p => Math.max(1, p - 1))}
                          disabled={filePage === 1}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 disabled:opacity-30 hover:text-slate-900 transition-all"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">
                          Page {filePage} of {Math.ceil(fileTotal / fileLimit)}
                        </span>
                        <button
                          onClick={() => setFilePage(p => Math.min(Math.ceil(fileTotal / fileLimit), p + 1))}
                          disabled={filePage >= Math.ceil(fileTotal / fileLimit)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 disabled:opacity-30 hover:border-blue-400 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
