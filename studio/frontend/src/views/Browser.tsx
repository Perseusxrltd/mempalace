import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Clock, User, ArrowRight, ChevronLeft, ChevronRight as CR } from 'lucide-react'
import { api } from '../api/client'
import { wingColor, type DrawerSummary } from '../types'
import TrustBadge from '../components/TrustBadge'
import WingBadge from '../components/WingBadge'

const PAGE = 50

function DrawerRow({ drawer, onClick }: { drawer: DrawerSummary; onClick: () => void }) {
  return (
    <button
      className="flex items-start gap-4 w-full px-4 py-3 border-b hover-row text-left transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onClick={onClick}
    >
      <FileText size={14} className="text-muted flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <WingBadge wing={drawer.wing} room={drawer.room} />
          {drawer.trust && <TrustBadge trust={drawer.trust} />}
        </div>
        <p className="text-sm text-white/80 leading-relaxed line-clamp-2">{drawer.preview}</p>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted">
          {drawer.added_by && (
            <span className="flex items-center gap-1"><User size={9} />{drawer.added_by}</span>
          )}
          {drawer.timestamp && (
            <span className="flex items-center gap-1">
              <Clock size={9} />
              {drawer.timestamp.slice(0, 10)}
            </span>
          )}
          <span className="font-mono">{drawer.char_count.toLocaleString()} chars</span>
        </div>
      </div>
      <ArrowRight size={12} className="text-faint flex-shrink-0 mt-1" />
    </button>
  )
}

export default function Browser() {
  const { wing, room } = useParams<{ wing?: string; room?: string }>()
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['drawers', wing, room, offset],
    queryFn: () => api.drawers({ wing, room, limit: PAGE, offset }),
    placeholderData: (prev) => prev,
  })

  const drawers = (data as any)?.drawers ?? []
  const hasMore = drawers.length === PAGE
  const color = wing ? wingColor(wing) : '#7c6af7'

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Breadcrumb header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <button onClick={() => navigate('/browse')} className="text-muted hover:text-white transition-colors">Browse</button>
        {wing && (
          <>
            <ChevronRight size={12} className="text-faint" />
            <button
              onClick={() => navigate(`/browse/${wing}`)}
              className="hover:text-white transition-colors font-medium"
              style={{ color }}
            >{wing}</button>
          </>
        )}
        {room && (
          <>
            <ChevronRight size={12} className="text-faint" />
            <span className="text-white">{room}</span>
          </>
        )}
        <span className="ml-auto text-xs text-muted font-mono">
          {isLoading ? '…' : `${offset + 1}–${offset + drawers.length} shown`}
        </span>
      </div>

      {/* Empty / loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted text-sm">Loading drawers…</div>
        </div>
      )}

      {!isLoading && drawers.length === 0 && (
        <div className="flex-1 flex items-center justify-center flex-col gap-2">
          <FileText size={32} className="text-faint" />
          <div className="text-muted text-sm">No drawers found</div>
          {!wing && <div className="text-xs text-faint">Select a wing from the sidebar to browse</div>}
        </div>
      )}

      {/* Drawer list */}
      <div className="flex-1 overflow-y-auto">
        {drawers.map((d: any) => (
          <DrawerRow
            key={d.id}
            drawer={d}
            onClick={() => navigate(`/drawer/${encodeURIComponent(d.id)}`)}
          />
        ))}
      </div>

      {/* Pagination */}
      {(offset > 0 || hasMore) && (
        <div className="flex items-center justify-between px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE))}
            className="flex items-center gap-1 px-3 py-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/8"
          >
            <ChevronLeft size={12} /> Previous
          </button>
          <span className="text-muted">Page {Math.floor(offset / PAGE) + 1}</span>
          <button
            disabled={!hasMore}
            onClick={() => setOffset(offset + PAGE)}
            className="flex items-center gap-1 px-3 py-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/8"
          >
            Next <CR size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
