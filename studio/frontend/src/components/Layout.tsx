import { useState, useEffect, createContext, useContext } from 'react'
import { Outlet } from 'react-router-dom'
import Ribbon from './Ribbon'
import LeftSidebar from './LeftSidebar'
import StatusBar from './StatusBar'
import CommandPalette from './CommandPalette'

// ── Layout context ─────────────────────────────────────────────────────────────

interface LayoutCtx {
  openPalette: () => void
}

export const LayoutContext = createContext<LayoutCtx>({ openPalette: () => {} })
export const useLayoutCtx = () => useContext(LayoutContext)

// ── Layout ─────────────────────────────────────────────────────────────────────

export default function Layout() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <LayoutContext.Provider value={{ openPalette: () => setPaletteOpen(true) }}>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: 'var(--background-primary)' }}
      >
        {/* Ribbon — 44px leftmost icon strip */}
        <Ribbon onSearch={() => setPaletteOpen(true)} />

        {/* Left sidebar — Obsidian file explorer */}
        <LeftSidebar />

        {/* Main content column */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-hidden flex flex-col">
            <Outlet />
          </main>
          <StatusBar />
        </div>
      </div>

      {/* Command palette — rendered outside main flow */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </LayoutContext.Provider>
  )
}
