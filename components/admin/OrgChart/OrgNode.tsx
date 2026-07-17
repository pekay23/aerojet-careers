'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps, Node } from '@xyflow/react'
import { Mail, Shield, User, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StaffNodeData = {
  name: string
  title: string
  department: string
  email: string
  avatar?: string
  role: string
}

export type StaffNode = Node<StaffNodeData, 'staffNode'>

const OrgNode = ({ data, selected }: NodeProps<StaffNode>) => {
  const isManagement = ['admin', 'super_admin', 'hr_manager'].includes(data.role)
  
  return (
    <div className={cn(
      "group relative flex flex-col w-[260px] bg-white rounded-2xl border-2 transition-all duration-300",
      selected ? "border-blue-500 shadow-2xl shadow-blue-500/20 -translate-y-1" : "border-slate-100 shadow-xl shadow-slate-200/50 hover:border-slate-300",
      isManagement && "bg-slate-50/50"
    )}>
      {/* Top Bar Accent */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl",
        isManagement ? "bg-slate-900" : "bg-blue-600"
      )} />

      <Handle type="target" position={Position.Top} className="!bg-slate-300 !border-white !w-3 !h-3" />
      
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-4">
           <div className="relative shrink-0">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-xl text-slate-400 uppercase overflow-hidden">
                {data.avatar ? (
                  <img src={data.avatar} alt={data.name} className="h-full w-full object-cover" />
                ) : (
                  <User size={24} />
                )}
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-white shadow-sm",
                isManagement ? "bg-slate-900" : "bg-emerald-500"
              )} />
           </div>

           <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 truncate leading-tight uppercase tracking-tight">{data.name}</h3>
              <p className="text-[10px] font-bold text-blue-600 truncate uppercase tracking-widest mt-0.5">{data.title}</p>
              <div className="mt-2 flex items-center gap-1.5">
                 <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 tracking-widest uppercase">
                   {data.department}
                 </span>
              </div>
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-slate-400">
           <div className="flex items-center gap-2">
              <Mail size={12} />
              <span className="text-[9px] font-bold truncate max-w-[120px]">{data.email}</span>
           </div>
           {isManagement && (
             <Shield size={12} className="text-slate-900" />
           )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !border-white !w-3 !h-3" />
      
      {/* Visual connection indicator for hover states */}
      <div className="absolute inset-0 rounded-2xl ring-4 ring-blue-500/0 group-hover:ring-blue-500/5 transition-all pointer-events-none" />
    </div>
  )
}

export default memo(OrgNode)
