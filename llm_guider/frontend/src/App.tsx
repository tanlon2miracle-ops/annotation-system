import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import RegistryPage from './pages/RegistryPage'
import RoutingPage from './pages/RoutingPage'
import SmartRoutingPage from './pages/SmartRoutingPage'
import LogsPage from './pages/LogsPage'

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<RegistryPage />} />
        <Route path="/routing" element={<RoutingPage />} />
        <Route path="/smart" element={<SmartRoutingPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
