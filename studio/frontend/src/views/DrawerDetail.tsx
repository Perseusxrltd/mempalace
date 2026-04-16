import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Copy, Trash2, CheckCircle, XCircle, Clock,
  FileText, User, Hash, Link2, Shield
} from 'lucide-react'
import { api } from '../api/client'
import WingBadge from '../components/WingBadge'
import TrustBadge, { ConfidenceBar } from '../components/TrustBadge'

export default function DrawerDetail() {
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Extract drawer ID from path — everything after /drawer/
  const drawerId = decodeURIComponent(location.pathname.replace(/^\/drawer\//, ''))

  const { data, isLoading, error } = useQuery({
    queryKey: ['drawer', drawerId],
    queryFn: () => api.drawer(drawerId),
    enabled: !!drawerId,
  })

  const verifyMut = useMutation({
    mutationFn: () => api.verifyDrawer(drawerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drawer', drawerId] }),
  })

  const challengeMut = useMutation({
    mutationFn: () => api.challengeDrawer(drawerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drawer', drawerId] }),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.deleteDrawer(drawerId),
    onSuccess: () => navigate(-1),
  })

  function copyId() {
    navigator.clipboard.writeText(drawerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted text-sm">Loading drawer…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <FileText size={32} className="text-faint" />
        <div className="text-muted">Drawer not found</div>
        <button onClick={() => navigate(-1)} className="text-xs text-accent hover:underline">Go back</button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <button onClick={() => navigate(-1)} className="text-muted hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </button>
          <WingBadge wing={data.wing} room={data.room} size="md" />
          <div className="flex-1" />
          <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
            {copied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy ID'}
          </button>
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-400/10">
              <Trash2 size={12} /> Delete
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-400">Sure?</span>
              <button onClick={() => deleteMut.mutate()}
                className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                Yes
              </button>
              <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 rounded text-xs text-muted hover:text-white transition-colors">
                No
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="drawer-content">{data.content}</pre>
        </div>
      </div>

      {/* Right panel — metadata */}
      <div className="w-72 flex-shrink-0 border-l flex flex-col overflow-y-auto"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

        {/* Metadata */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Metadata</h3>
          {[
            { icon: Hash, label: 'ID', value: drawerId.slice(-24), mono: true },
            { icon: User, label: 'Added by', value: data.added_by || '—' },
            { icon: Clock, label: 'Timestamp', value: data.timestamp ? data.timestamp.slice(0, 16) : '—' },
            { icon: FileText, label: 'Size', value: `${data.char_count.toLocaleString()} chars` },
            { icon: Link2, label: 'Source', value: data.source || '—', truncate: true },
          ].map(({ icon: Icon, label, value, mono, truncate }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={12} className="text-muted flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <div className="text-[10px] text-muted">{label}</div>
                <div className={`text-xs ${mono ? 'font-mono' : ''} ${truncate ? 'truncate' : ''}`}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Shield size={11} /> Trust
          </h3>
          {data.trust ? (
            <>
              <TrustBadge trust={data.trust} showConfidence />
              <ConfidenceBar confidence={data.trust.confidence ?? 1} />
              <div className="flex gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle size={10} className="text-emerald-400" />
                  {data.trust.verifications} verifications
                </span>
                <span className="flex items-center gap-1">
                  <XCircle size={10} className="text-orange-400" />
                  {data.trust.challenges} challenges
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => verifyMut.mutate()}
                  disabled={verifyMut.isPending}
                  className="flex-1 py-1.5 rounded text-xs font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                >
                  Verify
                </button>
                <button
                  onClick={() => challengeMut.mutate()}
                  disabled={challengeMut.isPending}
                  className="flex-1 py-1.5 rounded text-xs font-medium bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                >
                  Challenge
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">No trust record</div>
          )}
        </div>

        {/* Trust history */}
        {data.trust_history && data.trust_history.length > 0 && (
          <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">History</h3>
            <div className="space-y-2">
              {data.trust_history.map((h, i) => (
                <div key={i} className="text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize" style={{
                      color: { current: '#10B981', superseded: '#F59E0B', contested: '#F97316', historical: '#6B7280' }[h.status] ?? '#9CA3AF'
                    }}>{h.status}</span>
                    <span className="text-muted">{h.changed_at?.slice(0, 10)}</span>
                  </div>
                  {h.reason && <div className="text-muted mt-0.5 truncate">{h.reason}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {data.related && data.related.length > 0 && (
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Related</h3>
            <div className="space-y-2">
              {data.related.map(r => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/drawer/${encodeURIComponent(r.id)}`)}
                  className="w-full text-left p-2 rounded-lg text-xs hover:bg-white/5 transition-colors"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <WingBadge wing={r.wing} room={r.room} />
                  <p className="text-muted mt-1 line-clamp-2">
                    {(r.content ?? '').slice(0, 100)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
