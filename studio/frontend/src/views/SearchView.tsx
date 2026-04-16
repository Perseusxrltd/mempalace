import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal, Clock, FileText } from 'lucide-react'
import { api } from '../api/client'
import type { SearchHit } from '../types'
import WingBadge from '../components/WingBadge'
import TrustBadge from '../components/TrustBadge'

function highlight(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

export default function SearchView() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [wingFilter, setWingFilter] = useState('')
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mnemion_search_history') ?? '[]') } catch { return [] }
  })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const initial = params.get('q')
    if (initial) { setQ(initial); doSearch(initial) }
  }, [])

  async function doSearch(query: string) {
    if (!query.trim()) { setResults([]); return }
    setLoading(true); setError('')
    try {
      const res = await api.search({ q: query, wing: wingFilter || undefined, limit: 30 })
      setResults(res.results)
      const updated = [query, ...history.filter(h => h !== query)].slice(0, 10)
      setHistory(updated)
      localStorage.setItem('mnemion_search_history', JSON.stringify(updated))
      setParams({ q: query }, { replace: true })
    } catch (e: any) {
      setError(e.message ?? 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  function onChange(v: string) {
    setQ(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 300)
  }

  function clearHistory() {
    setHistory([])
    localStorage.removeItem('mnemion_search_history')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search bar */}
      <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              autoFocus
              value={q}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(q)}
              placeholder="Search drawers…"
              className="w-full bg-raised border rounded-lg py-2.5 pl-9 pr-10 text-sm outline-none focus:border-accent transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
            {q && (
              <button onClick={() => { setQ(''); setResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm border transition-colors ${showFilters ? 'border-accent text-accent bg-accent/10' : 'text-muted hover:text-white border-transparent hover:border-border'}`}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex items-center gap-3 mt-3 max-w-2xl">
            <input
              value={wingFilter}
              onChange={e => setWingFilter(e.target.value)}
              placeholder="Wing filter (e.g. legal)"
              className="px-3 py-1.5 rounded-lg text-xs border outline-none focus:border-accent transition-colors"
              style={{ background: 'var(--raised)', borderColor: 'var(--border)', color: 'var(--text)', width: 200 }}
            />
            {wingFilter && (
              <button onClick={() => setWingFilter('')} className="text-xs text-muted hover:text-white">
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* No query — show history */}
        {!q && history.length > 0 && (
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">Recent searches</span>
              <button onClick={clearHistory} className="text-xs text-muted hover:text-white transition-colors">Clear</button>
            </div>
            <div className="space-y-1">
              {history.map(h => (
                <button key={h} onClick={() => { setQ(h); doSearch(h) }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5 transition-colors text-left">
                  <Clock size={12} className="flex-shrink-0" />
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12 text-sm text-muted">Searching…</div>
        )}

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm text-red-400 bg-red-400/10 border border-red-400/20">
            {error}
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            <div className="px-6 py-2 text-xs text-muted border-b" style={{ borderColor: 'var(--border)' }}>
              {results.length} results for <span className="text-white font-medium">"{q}"</span>
            </div>
            {results.map(hit => {
              const sim = hit.similarity ?? hit.score ?? 0
              const simPct = Math.round(sim * 100)
              const preview = (hit.content ?? '').slice(0, 400)
              return (
                <button
                  key={hit.id}
                  className="flex items-start gap-4 w-full px-6 py-4 border-b hover-row text-left transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={() => navigate(`/drawer/${encodeURIComponent(hit.id)}`)}
                >
                  <FileText size={14} className="text-muted flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <WingBadge wing={hit.wing} room={hit.room} />
                      {simPct > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(124,106,247,0.12)', color: '#9d8ff9' }}>
                          {simPct}% match
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm text-white/75 leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: highlight(preview, q) }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Empty */}
        {!loading && q && results.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Search size={28} className="text-faint" />
            <div className="text-muted text-sm">No results for "{q}"</div>
            <div className="text-xs text-faint">Try a different query or remove wing filters</div>
          </div>
        )}
      </div>

      <style>{`
        mark {
          background: rgba(124, 106, 247, 0.3);
          color: #c4b5fd;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  )
}
