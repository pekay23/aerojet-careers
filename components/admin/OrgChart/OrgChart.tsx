'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Panel,
  Background,
  Controls,
  ConnectionMode,
  OnConnect,
  reconnectEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { Layout, RotateCw } from 'lucide-react'
import OrgNode, { StaffNode } from './OrgNode'
import { cn } from '@/lib/utils'

// Custom node types
const nodeTypes = {
  staffNode: OrgNode,
} as any // Bypassing strict internal React Flow prop matching for custom nodes

// Layout configuration
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 260
const nodeHeight = 160

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

export default function OrgChart() {
  const [nodes, setNodes, onNodesChange] = useNodesState<StaffNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/organization')
      const json = await res.json()
      
      if (!res.ok || !json.data) {
        console.error('Failed to fetch org data:', json.error)
        setNodes([])
        setEdges([])
        return
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        json.data.nodes || [],
        json.data.edges || [],
        direction
      )

      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    } catch (err) {
      console.error('Org chart fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [direction, setNodes, setEdges])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds)),
    [setEdges]
  )

  const onReconnect = useCallback(
    async (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els))
      
      // Persist to backend
      setSaving(true)
      try {
        await fetch('/api/admin/organization', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            staffId: newConnection.target,
            reportsTo: newConnection.source
          })
        })
      } finally {
        setSaving(false)
      }
    },
    [setEdges]
  )

  const toggleDirection = () => {
    const newDir = direction === 'LR' ? 'TB' : 'LR'
    setDirection(newDir)
  }

  if (loading) {
    return (
      <div className="h-[600px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
         <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
         <p className="mt-4 text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse">Mapping Aerojet Hierarchy…</p>
      </div>
    )
  }

  return (
    <div className="h-[700px] w-full bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden relative shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-slate-50"
      >
        <Background gap={20} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="!bg-white !border-slate-200 !shadow-xl" />
        
        <Panel position="top-right" className="flex flex-col gap-2">
           <div className="bg-white/80 backdrop-blur-md p-2 rounded-xl border border-slate-200 shadow-xl flex gap-2">
              <button
                onClick={toggleDirection}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors flex items-center gap-2"
                title="Switch Layout Orientation"
              >
                <RotateCw size={18} className={cn("transition-transform duration-500", direction === 'TB' ? 'rotate-90' : 'rotate-0')} />
                <span className="text-[10px] font-bold uppercase tracking-widest px-2">
                   {direction === 'LR' ? 'Horizontal' : 'Vertical'}
                </span>
              </button>
              
              <div className="w-px h-6 bg-slate-200 my-auto" />
              
              <button
                onClick={() => fetchData()}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Refresh and Auto-layout"
              >
                <Layout size={18} />
              </button>
           </div>
           
           {saving && (
             <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2 flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Updating Structure...
             </div>
           )}
        </Panel>

        <Panel position="bottom-left" className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-lg max-w-xs">
           <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] mb-2">Instructions</h4>
              <p className="text-[10px] text-slate-600 leading-relaxed font-bold uppercase">
                • Drag connections to reassign managers.<br />
                • Click nodes to select/focus.<br />
                • Use scroll to zoom, right-click to pan.
              </p>
           </div>
        </Panel>
      </ReactFlow>
    </div>
  )
}
