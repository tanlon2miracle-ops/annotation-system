import { useEffect, useState, useCallback } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { downloadBlob } from '../api/client'
import type { SessionData } from '../types'

export function ExportPage() {
  const { sessions, fetchSessions } = useSessionStore()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [includeSkipped, setIncludeSkipped] = useState(false)
  const [includeUnannotated, setIncludeUnannotated] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleExport = useCallback(async () => {
    if (!selectedId) return
    setExporting(true)
    try {
      const blob = await downloadBlob('/export', {
        session_id: selectedId,
        include_skipped: includeSkipped,
        include_unannotated: includeUnannotated,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export_session_${selectedId}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }, [selectedId, includeSkipped, includeUnannotated])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">导出标注结果</h1>

      <div className="space-y-4 glass rounded-xl p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">选择会话</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- 请选择 --</option>
            {sessions.map((s: SessionData) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.mode}) - Batch #{s.batch_id}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeSkipped}
              onChange={(e) => setIncludeSkipped(e.target.checked)}
            />
            包含已跳过的条目
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeUnannotated}
              onChange={(e) => setIncludeUnannotated(e.target.checked)}
            />
            包含未标注的条目
          </label>
        </div>

        <button
          className="w-full bg-gray-900 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedId || exporting}
          onClick={handleExport}
        >
          {exporting ? '导出中...' : '导出 JSON'}
        </button>
      </div>
    </div>
  )
}
