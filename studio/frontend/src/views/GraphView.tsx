import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core'
import Graph from 'graphology'
import forceAtlas2 from 'graphology-layout-forceatlas2'
import { Network, RefreshCw, X } from 'lucide-react'
import { api } from '../api/client'
import { wingColor } from '../types'
import '@react-sigma/core/lib/style.css'

const ENTITY_COLORS: Record<string, string> = {
  person: '#60A5FA',
  project: '#4ECDC4',
  tool: '#A78BFA',
  concept: '#10B981',
  place: '#F59E0B',
  event: '#EC4899',
  entity: '#9CA3AF',
  unknown: '#6B7280',
}

function entityColor(type: string): string {
  return ENTITY_COLORS[type] ?? ENTITY_COLORS.entity
}

interface SelectedNode {
  id: string
  label: string
  type: string
  edges: { label: string; neighbor: string; direction: 'in' | 'out' }[]
}

function GraphLoader({ onNodeClick, setReady }: {
  onNodeClick: (n: SelectedNode | null) => void
  setReady: (v: boolean) => void
}) {
  const loadGraph = useLoadGraph()
  const registerEvents = useRegisterEvents()
  const sigma = useSigma()

  const { data: kgData } = useQuery({
    queryKey: ['kg-graph'],
    queryFn: () => api.kgGraph(1500),
    staleTime: 120_000,
  })

  useEffect(() => {
    if (!kgData) return

    const graph = new Graph()

    // Add nodes
    for (const n of kgData.nodes) {
      const color = entityColor(n.type)
      if (!graph.hasNode(n.id)) {
        graph.addNode(n.id, {
          label: n.label,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          size: 4,
          color,
          type: n.type,
        })
      }
    }

    // Add edges — only if both endpoints exist
    for (const e of kgData.edges) {
      if (graph.hasNode(e.source) && graph.hasNode(e.target) && !graph.hasEdge(e.id)) {
        try {
          graph.addEdge(e.source, e.target, {
            label: e.label,
            size: 1,
            color: 'rgba(255,255,255,0.12)',
          })
        } catch {}
      }
    }

    // Run ForceAtlas2 synchronously then load
    if (graph.order > 0) {
      forceAtlas2.assign(graph, {
        iterations: 100,
        settings: { gravity: 0.5, scalingRatio: 10, slowDown: 8, adjustSizes: false },
      })
    }

    loadGraph(graph)
    setReady(true)
  }, [kgData, loadGraph, setReady])

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        const g = sigma.getGraph()
        const attrs = g.getNodeAttributes(node)
        const edges = g.edges(node).map(e => {
          const source = g.source(e)
          const target = g.target(e)
          const attrs = g.getEdgeAttributes(e)
          const direction = source === node ? 'out' : 'in'
          const neighbor = direction === 'out' ? target : source
          return {
            label: attrs.label ?? '',
            neighbor: g.getNodeAttribute(neighbor, 'label') ?? neighbor,
            direction: direction as 'in' | 'out',
          }
        })
        onNodeClick({ id: node, label: attrs.label, type: attrs.type, edges })
      },
      clickStage: () => onNodeClick(null),
    })
  }, [registerEvents, sigma, onNodeClick])

  return null
}

export default function GraphView() {
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'kg' | 'wings'>('kg')
  const sigmaRef = useRef<any>(null)

  const { data: status } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: taxonomy } = useQuery({ queryKey: ['taxonomy'], queryFn: api.taxonomy })

  const handleNodeClick = useCallback((n: SelectedNode | null) => setSelected(n), [])

  // Build wing graph from taxonomy
  const wingGraph = (() => {
    if (!taxonomy) return null
    const g = new Graph()
    for (const [wing, rooms] of Object.entries(taxonomy.taxonomy)) {
      const total = Object.values(rooms as Record<string, number>).reduce((s, n) => s + n, 0)
      const color = wingColor(wing)
      if (!g.hasNode(wing)) {
        g.addNode(wing, {
          label: wing,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          size: Math.max(6, Math.min(20, total / 500)),
          color,
        })
      }
      for (const [room, count] of Object.entries(rooms as Record<string, number>)) {
        const roomId = `${wing}/${room}`
        if (!g.hasNode(roomId)) {
          g.addNode(roomId, {
            label: room,
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            size: Math.max(3, Math.min(8, (count as number) / 200)),
            color: color + 'bb',
          })
        }
        if (!g.hasEdge(wing, roomId)) {
          g.addEdge(wing, roomId, { size: 0.8, color: color + '44' })
        }
      }
    }
    return g
  })()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <Network size={16} className="text-accent" />
        <span className="font-medium text-sm">Memory Graph</span>
        <div className="flex gap-1 ml-4">
          {(['kg', 'wings'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${mode === m ? 'bg-accent/20 text-accent' : 'text-muted hover:text-white'}`}>
              {m === 'kg' ? 'Knowledge Graph' : 'Wing Map'}
            </button>
          ))}
        </div>
        {!ready && mode === 'kg' && (
          <span className="flex items-center gap-1.5 text-xs text-muted ml-2">
            <RefreshCw size={11} className="animate-spin" /> Layouting…
          </span>
        )}
        <div className="ml-auto text-xs text-muted">
          {mode === 'kg'
            ? 'KG entities + relations'
            : `${Object.keys(taxonomy?.taxonomy ?? {}).length} wings`}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-20 left-56 z-10 flex flex-wrap gap-2 p-3 rounded-lg" style={{ background: 'rgba(17,17,17,0.85)', border: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
        {mode === 'kg' ? (
          Object.entries(ENTITY_COLORS).filter(([k]) => k !== 'unknown').map(([type, color]) => (
            <span key={type} className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-muted capitalize">{type}</span>
            </span>
          ))
        ) : (
          Object.entries(taxonomy?.taxonomy ?? {}).slice(0, 6).map(([wing]) => (
            <span key={wing} className="flex items-center gap-1 text-[10px]">
              <span className="w-2 h-2 rounded-full" style={{ background: wingColor(wing) }} />
              <span style={{ color: wingColor(wing) }}>{wing}</span>
            </span>
          ))
        )}
      </div>

      <div className="flex-1 relative">
        {mode === 'kg' ? (
          <SigmaContainer
            ref={sigmaRef}
            style={{ width: '100%', height: '100%', background: '#191919' }}
            settings={{
              renderEdgeLabels: false,
              defaultEdgeType: 'arrow',
              labelFont: 'Inter, sans-serif',
              labelSize: 11,
              labelColor: { color: '#aaa' },
              minCameraRatio: 0.05,
              maxCameraRatio: 20,
            }}
          >
            <GraphLoader onNodeClick={handleNodeClick} setReady={setReady} />
          </SigmaContainer>
        ) : (
          wingGraph && (
            <SigmaContainer
              style={{ width: '100%', height: '100%', background: '#191919' }}
              graph={wingGraph}
              settings={{
                renderEdgeLabels: false,
                labelFont: 'Inter, sans-serif',
                labelSize: 12,
                labelColor: { color: '#ddd' },
                minCameraRatio: 0.05,
                maxCameraRatio: 20,
              }}
            />
          )
        )}

        {/* Selected node panel */}
        {selected && (
          <div
            className="absolute top-4 right-4 w-64 rounded-xl p-4 fade-in"
            style={{ background: 'rgba(36,36,36,0.95)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">{selected.label}</div>
                <div className="text-xs mt-0.5" style={{ color: entityColor(selected.type) }}>{selected.type}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {selected.edges.slice(0, 15).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-muted">{e.direction === 'out' ? '→' : '←'}</span>
                  <span className="text-accent/80 italic">{e.label}</span>
                  <span className="text-white/70 truncate">{e.neighbor}</span>
                </div>
              ))}
              {selected.edges.length === 0 && <div className="text-xs text-muted">No relations</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
