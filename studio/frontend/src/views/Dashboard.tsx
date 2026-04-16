import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Database, Network, Layers, Bot, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { api } from '../api/client'
import { wingColor } from '../types'
import TrustBadge from '../components/TrustBadge'

function StatCard({ icon: Icon, label, value, sub, color = '#7c6af7', onClick }:
  { icon: any; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void }) {
  return (
    <button
      className="flex flex-col gap-3 p-5 rounded-xl text-left transition-all hover:scale-[1.02] fade-in"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
        <span className="p-1.5 rounded-lg" style={{ background: color + '20' }}>
          <Icon size={14} style={{ color }} />
        </span>
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
      </div>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: status, isLoading: sLoading } = useQuery({ queryKey: ['status'], queryFn: api.status })
  const { data: trust } = useQuery({ queryKey: ['trust-stats'], queryFn: api.trustStats })
  const { data: agents } = useQuery({ queryKey: ['agents'], queryFn: api.agents })

  const topWings = status
    ? Object.entries(status.wings).sort((a, b) => b[1] - a[1]).slice(0, 8)
    : []

  const topRooms = status
    ? Object.entries(status.rooms).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : []

  const activeAgents = agents?.activity?.length ?? 0
  const contestedCount = trust?.contested_conflicts ?? 0
  const currentPct = trust?.by_status?.current
    ? Math.round((trust.by_status.current.count / (trust.total || 1)) * 100)
    : null

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted mt-0.5">Anaktoron status and memory health at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Database} label="Total Drawers" value={status?.total_drawers ?? '—'}
          color="#7c6af7" onClick={() => navigate('/browse')} />
        <StatCard icon={Layers} label="Wings" value={status?.wing_count ?? '—'}
          sub={`${status?.room_count ?? 0} rooms`} color="#4A9EFF" onClick={() => navigate('/browse')} />
        <StatCard icon={Bot} label="Active Agents" value={activeAgents}
          sub="seen in sessions" color="#4ECDC4" onClick={() => navigate('/agents')} />
        <StatCard icon={Network} label="Trust Health" value={currentPct !== null ? `${currentPct}%` : '—'}
          sub="drawers current" color="#10B981" onClick={() => navigate('/settings')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Wings breakdown */}
        <div className="rounded-xl p-5 fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Wings</h2>
            <button onClick={() => navigate('/browse')} className="text-xs text-muted hover:text-accent transition-colors">Browse all →</button>
          </div>
          <div className="space-y-2">
            {topWings.map(([wing, count]) => {
              const color = wingColor(wing)
              const total = status!.total_drawers
              const pct = Math.round((count / total) * 100)
              return (
                <button
                  key={wing}
                  className="flex items-center gap-3 w-full hover-row rounded px-2 py-1.5 transition-colors"
                  onClick={() => navigate(`/browse/${wing}`)}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="flex-1 text-sm truncate text-left" style={{ color }}>{wing}</span>
                  <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                    <div className="h-full rounded-full" style={{ background: color, width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted w-16 text-right">{count.toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Trust overview */}
        <div className="rounded-xl p-5 fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Memory Trust</h2>
            {contestedCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">
                <AlertTriangle size={10} /> {contestedCount} contested
              </span>
            )}
          </div>
          {trust ? (
            <div className="space-y-3">
              {Object.entries(trust.by_status ?? {}).map(([status, data]) => {
                const colors: Record<string, string> = {
                  current: '#10B981', superseded: '#F59E0B',
                  contested: '#F97316', historical: '#6B7280',
                }
                const color = colors[status] ?? '#6B7280'
                const pct = Math.round((data.count / trust.total) * 100)
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color }} className="capitalize font-medium">{status}</span>
                      <span className="text-muted">{data.count.toLocaleString()} · {pct}%</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--raised)' }}>
                      <div className="h-full rounded-full transition-all" style={{ background: color, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <div className="pt-2 border-t text-xs text-muted flex items-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
                <CheckCircle size={11} className="text-emerald-400" />
                avg confidence {Math.round((trust.by_status?.current?.avg_confidence ?? 1) * 100)}%
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">Loading trust data…</div>
          )}
        </div>
      </div>

      {/* Active agents */}
      {agents?.activity && agents.activity.length > 0 && (
        <div className="rounded-xl p-5 fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Recent Agent Activity</h2>
            <button onClick={() => navigate('/agents')} className="text-xs text-muted hover:text-accent transition-colors">View all →</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {agents.activity.slice(0, 4).map(a => (
              <div key={a.agent} className="rounded-lg p-3" style={{ background: 'var(--raised)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium truncate">{a.agent}</span>
                </div>
                <div className="text-[10px] text-muted flex items-center gap-1">
                  <Clock size={9} />
                  {a.last_seen ? new Date(a.last_seen).toLocaleDateString() : 'unknown'}
                </div>
                <div className="text-[10px] text-muted mt-0.5">{a.session_entries} entries</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top rooms */}
      <div className="rounded-xl p-5 fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-4">Busiest Rooms</h2>
        <div className="flex flex-wrap gap-2">
          {topRooms.map(([room, count]) => (
            <button
              key={room}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:bg-white/8 transition-colors"
              style={{ background: 'var(--raised)', border: '1px solid var(--border)' }}
              onClick={() => navigate('/search?q=' + encodeURIComponent(room))}
            >
              <span className="text-muted">{room}</span>
              <span className="font-mono text-accent text-[10px]">{count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
