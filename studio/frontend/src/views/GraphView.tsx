import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core'
import Graph from 'graphology'
import { Network, RefreshCw, X, Info, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { api } from '../api/client'
import { wingColor } from '../types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function circlePos(i: number, total: number, r: number): [number, number] {
  const a = (2 * Math.PI * i) / total - Math.PI / 2
  return [Math.cos(a) * r, Math.sin(a) * r]
}

function buildWingGraph(taxonomy: Record<string, Record<string, number>>): Graph {
  const g = new Graph({ multi: false, type: 'undirected' })
  const wings = Object.entries(taxonomy)
  const WING_R = 8
  wings.forEach(([wing, rooms], wi) => {
    const total = Object.values(rooms).reduce((s, n) => s + n, 0)
    const [wx, wy] = circlePos(wi, wings.length, WING_R)
    const color = wingColor(wing)
    const size = Math.max(8, Math.min(24, total / 400))
    if (!g.hasNode(wing)) {
      g.addNode(wing, { label: wing, x: wx, y: wy, size, color })
    }
    const roomList = Object.entries(rooms as Record<string, number>)
    roomList.forEach(([room, count], ri) => {
      const roomId = `${wing}/${room}`
      const angle = (2 * Math.PI * ri) / roomList.length
      const rx = wx + Math.cos(angle) * (2.5 + roomList.length * 0.15)
      const ry = wy + Math.sin(angle) * (2.5 + roomList.length * 0.15)
      const rsize = Math.max(3, Math.min(10, (count as number) / 150))
      if (!g.hasNode(roomId)) {
        g.addNode(roomId, { label: room, x: rx, y: ry, size: rsize, color: color + 'cc' })
      }
      if (!g.hasEdge(wing, roomId)) {
        try { g.addEdge(wing, roomId, { size: 0.6, color: color + '55' }) } catch {}
      }
    })
  })
  return g
}

// ── KG Loader (must be inside SigmaContainer) ─────────────────────────────────

interface SelectedNode {
  id: string
  label: string
  type: string
  edges: { label: string; neighbor: string; direction: 'in' | 'out' }[]
}

function KGLoader({ onNodeClick, onReady }: {
  onNodeClick: (n: SelectedNode | null) => void
  onReady: () => void
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
    const g = new Graph()

    for (const n of kgData.nodes) {
      if (!g.hasNode(n.id)) {
        const TYPE_COLORS: Record<string, string> = {
          person: '#60A5FA', project: '#4ECDC4', tool: '#A78BFA',
          concept: '#10B981', place: '#F59E0B', event: '#EC4899',
        }
        const color = TYPE_COLORS[n.type] ?? '#9CA3AF'
        g.addNode(n.id, {
          label: n.label, x: Math.random() * 100, y: Math.random() * 100,
          size: 5, color,
        })
      }
    }
    for (const e of kgData.edges) {
      if (g.hasNode(e.source) && g.hasNode(e.target)) {
        try {
          g.addEdge(e.source, e.target, {
            label: e.label, size: 1, color: 'rgba(255,255,255,0.2)',
          })
        } catch {}
      }
    }

    // Apply ForceAtlas2 if graph has nodes
    if (g.order > 1) {
      try {
        import('graphology-layout-forceatlas2').then(mod => {
          const fa2 = mod.default ?? mod
          ;(fa2 as any).assign(g, { iterations: 150, settings: { gravity: 1, scalingRatio: 5, slowDown: 10 } })
          loadGraph(g)
          onReady()
        }).catch(() => { loadGraph(g); onReady() })
        return // will call loadGraph/onReady inside the promise
      } catch {
        // fall through
      }
    }

    // fallback: no nodes or FA2 import path not taken
    loadGraph(g)
    onReady()
  }, [kgData, loadGraph, onReady])

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        const g = sigma.getGraph()
        const attrs = g.getNodeAttributes(node)
        const edges = g.edges(node).map(e => {
          const src = g.source(e), tgt = g.target(e)
          const eattrs = g.getEdgeAttributes(e)
          const dir = src === node ? 'out' : 'in'
          const nb = dir === 'out' ? tgt : src
          return {
            label: eattrs.label ?? '',
            neighbor: g.getNodeAttribute(nb, 'label') ?? nb,
            direction: dir as 'in' | 'out',
          }
        })
        onNodeClick({ id: node, label: attrs.label, type: attrs.type ?? 'entity', edges })
      },
      clickStage: () => onNodeClick(null),
    })
  }, [registerEvents, sigma, onNodeClick])

  return null
}

// ── Wing Map Loader ────────────────────────────────────────────────────────────

function WingLoader({ graph, onNodeClick }: {
  graph: Graph
  onNodeClick: (label: string) => void
}) {
  const loadGraph = useLoadGraph()
  const registerEvents = useRegisterEvents()
  const sigma = useSigma()

  useEffect(() => {
    loadGraph(graph)
  }, [graph, loadGraph])

  useEffect(() => {
    registerEvents({
      clickNode: ({ node }) => {
        const label = sigma.getGraph().getNodeAttribute(node, 'label')
        onNodeClick(label)
      },
      clickStage: () => {},
    })
  }, [registerEvents, sigma, onNodeClick])

  return null
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GraphView() {
  const [mode, setMode] = useState<'wings' | 'kg'>('wings')
  const [selected, setSelected] = useState<SelectedNode | null>(null)
  const [kgReady, setKgReady] = useState(false)

  const { data: taxonomy } = useQuery({ queryKey: ['taxonomy'], queryFn: api.taxonomy })
  const { data: kgData } = useQuery({
    queryKey: ['kg-graph'],
    queryFn: () => api.kgGraph(1500),
    staleTime: 120_000,
    enabled: mode === 'kg',
  })

  const wingGraph = useMemo(() => {
    if (!taxonomy?.taxonomy) return null
    return buildWingGraph(taxonomy.taxonomy)
  }, [taxonomy])

  const handleNodeClick = useCallback((n: SelectedNode | null) => setSelected(n), [])
  const handleKgReady = useCallback(() => setKgReady(true), [])

  const kgNodeCount = kgData?.nodes?.length ?? 0

  const SIGMA_SETTINGS = {
    renderEdgeLabels: false,
    labelFont: 'Inter, sans-serif',
    labelSize: 11,
    labelColor: { color: '#999999' },
    defaultNodeColor: '#7f6df2',
    defaultEdgeColor: 'rgba(255,255,255,0.12)',
    minCameraRatio: 0.02,
    maxCameraRatio: 30,
    enableEdgeEvents: false,
    labelRenderedSizeThreshold: 6,
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: 'var(--background-modifier-border)', background: 'var(--background-secondary)', minHeight: 44 }}
      >
        <Network size={14} style={{ color: 'var(--interactive-accent)', flexShrink: 0 }} />
        <span className="font-medium text-sm">Memory Graph</span>

        {/* Mode switcher */}
        <div
          className="flex gap-0.5 ml-3 p-0.5 rounded-lg"
          style={{ background: 'var(--interactive-normal)' }}
        >
          {(['wings', 'kg'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelected(null) }}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={
                mode === m
                  ? { background: 'var(--interactive-accent)', color: 'white' }
                  : { color: 'var(--text-muted)' }
              }
              onMouseEnter={e => { if (mode !== m) e.currentTarget.style.color = 'var(--text-normal)' }}
              onMouseLeave={e => { if (mode !== m) e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              {m === 'wings' ? 'Wing Map' : 'Knowledge Graph'}
            </button>
          ))}
        </div>

        {mode === 'kg' && !kgReady && (
          <span className="flex items-center gap-1.5 text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
            <RefreshCw size={11} className="animate-spin" /> Building layout…
          </span>
        )}

        <div className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>
          {mode === 'wings'
            ? `${Object.keys(taxonomy?.taxonomy ?? {}).length} wings`
            : kgNodeCount > 0
              ? `${kgNodeCount} entities`
              : 'KG empty — run mnemion librarian'
          }
        </div>
      </div>

      {/* Graph area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sigma container — always absolute fill */}
        {mode === 'wings' && wingGraph && (
          <SigmaContainer
            key="wings"
            style={{ position: 'absolute', inset: 0, background: '#171717' }}
            settings={SIGMA_SETTINGS}
          >
            <WingLoader
              graph={wingGraph}
              onNodeClick={(label) => console.log('wing clicked', label)}
            />
          </SigmaContainer>
        )}

        {mode === 'kg' && (
          <SigmaContainer
            key="kg"
            style={{ position: 'absolute', inset: 0, background: '#171717' }}
            settings={SIGMA_SETTINGS}
          >
            <KGLoader onNodeClick={handleNodeClick} onReady={handleKgReady} />
          </SigmaContainer>
        )}

        {/* Empty KG state */}
        {mode === 'kg' && kgReady && kgNodeCount === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <Info size={28} className="text-faint" />
            <div className="text-sm text-muted">Knowledge Graph is empty</div>
            <div className="text-xs text-faint text-center max-w-xs">
              Run <code className="bg-raised px-1 rounded">mnemion librarian</code> to extract
              entity relationships from your drawers.
            </div>
          </div>
        )}

        {/* Legend — floating */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 p-3 rounded-lg"
          style={{ background: 'rgba(22,22,22,0.9)', border: '1px solid var(--background-modifier-border)', backdropFilter: 'blur(10px)', maxWidth: 280 }}>
          {mode === 'wings' ? (
            Object.keys(taxonomy?.taxonomy ?? {}).slice(0, 8).map(wing => (
              <span key={wing} className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: wingColor(wing) }} />
                <span style={{ color: wingColor(wing) }}>{wing}</span>
              </span>
            ))
          ) : (
            [['person','#60A5FA'],['project','#4ECDC4'],['tool','#A78BFA'],['concept','#10B981'],['place','#F59E0B']].map(([t,c]) => (
              <span key={t} className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c }} />
                <span className="text-muted capitalize">{t}</span>
              </span>
            ))
          )}
        </div>

        {/* Selected node info panel */}
        {selected && (
          <div
            className="absolute top-4 right-4 w-64 rounded-xl p-4 fade-in"
            style={{ background: 'rgba(30,30,30,0.96)', border: '1px solid var(--background-modifier-border)', backdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-sm">{selected.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--interactive-accent)' }}>{selected.type}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="transition-colors p-1 rounded"
                style={{ color: 'var(--text-faint)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-normal)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-faint)')}
              >
                <X size={13} />
              </button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {selected.edges.slice(0, 15).map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px]">
                  <span className="flex-shrink-0 font-mono w-3" style={{ color: 'var(--text-faint)' }}>
                    {e.direction === 'out' ? '→' : '←'}
                  </span>
                  <span className="italic flex-shrink-0" style={{ color: 'var(--interactive-accent)', opacity: 0.8 }}>
                    {e.label}
                  </span>
                  <span className="break-words" style={{ color: 'rgba(220,221,222,0.75)' }}>{e.neighbor}</span>
                </div>
              ))}
              {selected.edges.length === 0 && (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No relations found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
