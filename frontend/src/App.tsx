import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ImportPage } from './pages/ImportPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { ExportPage } from './pages/ExportPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/import" replace />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/workspace/:sessionId" element={<WorkspacePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
