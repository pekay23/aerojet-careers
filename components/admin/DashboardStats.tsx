'use client'

import React, { useState, useEffect } from 'react'
import { 
  Briefcase, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp,
  Activity,
  ArrowDownRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Snapshot {
  metric_name: string
  metric_value: number
  snapshot_date: string
}

export default function DashboardStats({ stats }: { stats: any }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/snapshot')
      .then(res => res.json())
      .then(({ data }) => {
        if (data) setSnapshots(data)
        setLoading(false)
      })
  }, [])

  const calculateTrend = (metricName: string, currentValue: number) => {
    if (loading) return { label: '...', positive: true }
    
    // Find the most recent snapshot that isn't today
    const today = new Date().toISOString().split('T')[0]
    const pastSnapshots = snapshots
      .filter(s => s.metric_name === metricName && s.snapshot_date !== today)
      .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())

    if (pastSnapshots.length === 0) return null

    const previousValue = pastSnapshots[0].metric_value
    if (previousValue === 0) return { label: 'First entry', positive: true }

    const change = currentValue - previousValue
    const percent = Math.round((change / previousValue) * 100)
    
    const diffDays = Math.round((new Date().getTime() - new Date(pastSnapshots[0].snapshot_date).getTime()) / (1000 * 3600 * 24))
    const timeline = diffDays <= 1 ? 'since yesterday' : `last ${diffDays} days`

    return {
      label: `${change >= 0 ? '+' : ''}${change} (${percent}%) ${timeline}`,
      positive: change >= 0
    }
  }

  const cards = [
    { 
      label: 'Active Jobs', 
      value: stats.activeJobs || 0, 
      subValue: `${stats.totalJobs || 0} total`, 
      icon: Briefcase, 
      color: 'blue' as const,
      trend: calculateTrend('total_jobs', stats.totalJobs)
    },
    { 
      label: 'Total Candidates', 
      value: stats.totalCandidates || 0, 
      icon: Users, 
      color: 'indigo' as const,
      trend: calculateTrend('total_candidates', stats.totalCandidates)
    },
    { 
      label: 'New Applications', 
      value: stats.newApplications || 0, 
      icon: Clock, 
      color: 'amber' as const,
      trend: calculateTrend('new_applications', stats.newApplications)
    },
    { 
      label: 'Positions Hired', 
      value: stats.hiredCount || 0, 
      icon: CheckCircle2, 
      color: 'emerald' as const,
      trend: calculateTrend('hired_count', stats.hiredCount)
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-default"
        >
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className={cn(
              "p-3 rounded-xl transition-transform group-hover:scale-110",
              card.color === 'blue' && "bg-blue-50 text-blue-600",
              card.color === 'indigo' && "bg-indigo-50 text-indigo-600",
              card.color === 'amber' && "bg-amber-50 text-amber-600",
              card.color === 'emerald' && "bg-emerald-50 text-emerald-600",
            )}>
              <card.icon size={24} />
            </div>
            
            <AnimatePresence>
               {card.trend && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                    card.trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  )}
                 >
                   {card.trend.positive ? <TrendingUp size={10} /> : <ArrowDownRight size={10} />}
                   {card.trend.label}
                 </motion.div>
               )}
            </AnimatePresence>
          </div>

          <div className="relative z-10">
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-1">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-slate-900 tracking-tighter">{card.value}</h3>
              {card.subValue && <span className="text-xs font-bold text-slate-400">/ {card.subValue}</span>}
            </div>
          </div>

          {/* Background Decoration */}
          <div className={cn(
            "absolute -right-4 -bottom-4 h-24 w-24 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity",
            card.color === 'blue' && "text-blue-600",
            card.color === 'indigo' && "text-indigo-600",
            card.color === 'amber' && "text-amber-600",
            card.color === 'emerald' && "text-emerald-600",
          )}>
            <card.icon size={120} strokeWidth={1} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
