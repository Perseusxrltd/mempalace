import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Network, FolderOpen, Search,
  Bot, Settings, ChevronDown, ChevronRight, Database,
} from 'lucide-react'
import { api } from '../api/client'
import { wingColor } from '../types'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/graph',     icon: Network,         label: 'Graph' },
  { to: '/browse',    icon: FolderOpen,      label: 'Browse' },
  { to: '/search',    icon: Search,          label: 'Search' },
  { to: '/agents',    icon: Bot,             label: 'Agents' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Sidebar() {
  const [wingsOpen, setWingsOpen] = useState(true)
  const [expandedWings, setExpandedWings] = useState<Record<string, boolean>>({})
  const navigate = useNavigate()

  const { data: taxonomy } = useQuery({
    queryKey: ['taxonomy'],
    queryFn: api.taxonomy,
    staleTime: 60_000,
  })

  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: api.status,
    staleTime: 30_000,
  })

  const wings = taxonomy?.taxonomy ?? {}
  const sorted = Object.entries(wings).sort((a, b) => b[1].__total - a[1].__total ||
    Object.values(b[1]).reduce((s, n) => s + n, 0) - Object.values(a[1]).reduce((s, n) => s + n, 0))

  function toggleWing(w: string) {
    setExpandedWings(prev => ({ ...prev, [w]: !prev[w] }))
  }

  return (
    <aside className="flex flex-col h-full" style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)', width: 220 }}>
      {/* Brand */}
      <div className="flex items-center gap-2 px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-lg">🏛️</span>
        <div>
          <div className="font-semibold text-sm tracking-tight">Mnemion</div>
          <div className="text-[10px]" style={{ color: 'var(--muted)' }}>Studio</div>
        </div>
        {status && (
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(124,106,247,0.15)', color: '#9d8ff9' }}>
            v{status.version}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="px-2 py-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
              ${isActive
                ? 'bg-accent/15 text-accent-light font-medium'
                : 'text-muted hover:text-white hover:bg-white/5'}`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="h-px mx-3 my-1" style={{ background: 'var(--border)' }} />

      {/* Wings tree */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <button
          className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-white transition-colors"
          onClick={() => setWingsOpen(v => !v)}
        >
          {wingsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          Wings
          {status && (
            <span className="ml-auto font-mono text-[10px] text-faint">{status.total_drawers.toLocaleString()}</span>
          )}
        </button>

        {wingsOpen && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(wings)
              .sort((a, b) =>
                Object.values(b[1]).reduce((s: number, n) => s + (n as number), 0) -
                Object.values(a[1]).reduce((s: number, n) => s + (n as number), 0)
              )
              .map(([wing, rooms]) => {
                const total = Object.values(rooms).reduce((s: number, n) => s + (n as number), 0)
                const color = wingColor(wing)
                const expanded = expandedWings[wing]
                const roomList = Object.entries(rooms as Record<string, number>).sort((a, b) => b[1] - a[1])
                return (
                  <div key={wing}>
                    <button
                      className="flex items-center gap-2 w-full px-3 py-1.5 rounded text-xs hover:bg-white/5 transition-colors text-left"
                      onClick={() => {
                        toggleWing(wing)
                        navigate(`/browse/${wing}`)
                      }}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="flex-1 truncate" style={{ color }}>{wing}</span>
                      <span className="text-[10px] font-mono text-faint">{total.toLocaleString()}</span>
                      <span className="text-faint" onClick={e => { e.stopPropagation(); toggleWing(wing) }}>
                        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                      </span>
                    </button>
                    {expanded && (
                      <div className="ml-4 border-l pl-2 space-y-0.5 mt-0.5" style={{ borderColor: color + '40' }}>
                        {roomList.map(([room, count]) => (
                          <NavLink
                            key={room}
                            to={`/browse/${wing}/${room}`}
                            className={({ isActive }) =>
                              `flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors
                              ${isActive ? 'text-white bg-white/8' : 'text-muted hover:text-white hover:bg-white/5'}`
                            }
                          >
                            <Database size={9} className="flex-shrink-0" />
                            <span className="flex-1 truncate">{room}</span>
                            <span className="text-[10px] font-mono text-faint">{count}</span>
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* Status dot */}
      {status && (
        <div className="px-4 py-3 border-t text-[10px] text-faint flex items-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-slow" />
          {status.total_drawers.toLocaleString()} drawers · {status.wing_count} wings
        </div>
      )}
    </aside>
  )
}
