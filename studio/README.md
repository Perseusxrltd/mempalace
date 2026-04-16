# Mnemion Studio

A local web dashboard for Mnemion — visualise, browse, and manage your Anaktoron.

## Features

| View | Description |
|------|-------------|
| **Dashboard** | Status overview, wing breakdown, trust health, agent activity |
| **Graph** | Obsidian-style force-directed graph — Knowledge Graph entities and Wing Map |
| **Browser** | Wing → Room → Drawer tree with paginated drawer list |
| **Search** | Hybrid semantic + lexical search across all drawers |
| **Agents** | Live heartbeat status of connected MCP agents |
| **Settings** | LLM backend config, Anaktoron path, MCP hook guide |

## Quick start (Windows)

```bat
cd C:\path\to\mnemion
studio\start.bat
```

Then open **http://localhost:5173**

## Manual start

**Backend (FastAPI):**
```bash
pip install -e ".[studio]"
uvicorn studio.backend.main:app --host 127.0.0.1 --port 7891 --reload
```

**Frontend (Vite + React):**
```bash
cd studio/frontend
npm install
npm run dev
```

## Architecture

```
studio/
├── backend/
│   └── main.py         FastAPI — imports mnemion.* directly
└── frontend/
    └── src/
        ├── views/      Dashboard, GraphView, Browser, Search, DrawerDetail, Agents, Settings
        ├── components/ Layout, Sidebar, TrustBadge, WingBadge
        └── api/        Typed client for all backend endpoints
```

**Backend port:** 7891  
**Frontend port:** 5173 (proxies `/api` → 7891)

## Agent heartbeats

Each MCP server process writes `~/.mnemion/heartbeats/<pid>.json` on every tool call.
Studio reads these to show live connection status. Set `MNEMION_AGENT_ID=your-agent-name`
in the MCP server environment to display a friendly name.
