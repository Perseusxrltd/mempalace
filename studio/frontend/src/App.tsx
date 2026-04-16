import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './views/Dashboard'
import GraphView from './views/GraphView'
import Browser from './views/Browser'
import SearchView from './views/SearchView'
import DrawerDetail from './views/DrawerDetail'
import AgentsView from './views/AgentsView'
import SettingsView from './views/SettingsView'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/graph" element={<GraphView />} />
          <Route path="/browse" element={<Browser />} />
          <Route path="/browse/:wing" element={<Browser />} />
          <Route path="/browse/:wing/:room" element={<Browser />} />
          <Route path="/drawer/*" element={<DrawerDetail />} />
          <Route path="/search" element={<SearchView />} />
          <Route path="/agents" element={<AgentsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
