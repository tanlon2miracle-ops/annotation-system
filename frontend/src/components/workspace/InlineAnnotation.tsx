import { useState, useCallback } from 'react'
import type { AnnotationData, ItemData } from '../../types'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useUIStore } from '../../stores/uiStore'
import { api } from '../../api/client'

interface InlineAnnotationProps {
  item: ItemData
  onUpdated: (itemId: number, ann: AnnotationData) => void
}

export function InlineAnnotation({ item, onUpdated }: InlineAnnotationProps) {
  const sessionId = useAnnotationStore(s => s.sessionId)
  const fetchProgress = useSessionStore(s => s.fetchProgress)
  const reasons = useUIStore(s => s.reasons)

  const ann = item.annotation
  const [result, setResult] = useState<string | null>(ann?.result ?? null)
  const [reason, setReason] = useState<string | null>(ann?.reason ?? null)
  const [saving, setSaving] = useState(false)

  const save = useCallback(async (r: string, rsn: string | null) => {
    if (!sessionId) return
    setSaving(true)
    try {
      const saved = await api.put<AnnotationData>('/annotations', {
        session_id: sessionId,
        item_id: item.id,
        result: r,
        reason: rsn,
      })
      onUpdated(item.id, saved)
      if (sessionId) fetchProgress(sessionId)
    } finally {
      setSaving(false)
    }
  }, [sessionId, item.id, onUpdated, fetchProgress])

  const handleResult = useCallback((val: string) => {
    setResult(val)
    save(val, reason)
  }, [reason, save])

  const handleReason = useCallback((val: string) => {
    setReason(val)
    if (result) save(result, val)
  }, [result, save])

  const isAnnotated = ann && !ann.is_skipped && ann.result

  return (
    <div className={`flex items-center gap-2 pt-2 border-t border-gray-100 ${saving ? 'opacity-60' : ''}`}>
      <button
        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
          result === '是'
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-green-50'
        }`}
        onClick={() => handleResult('是')}
      >
        YES
      </button>
      <button
        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
          result === '否'
            ? 'bg-red-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-red-50'
        }`}
        onClick={() => handleResult('否')}
      >
        NO
      </button>
      <select
        className="flex-1 text-xs border border-gray-200 rounded px-1.5 py-1 bg-white min-w-0"
        value={reason ?? ''}
        onChange={(e) => handleReason(e.target.value)}
      >
        <option value="">Reason...</option>
        {reasons.map((r) => (
          <option key={r.id} value={r.value}>{r.label}</option>
        ))}
      </select>
      {isAnnotated && (
        <span className="text-[10px] text-green-600 shrink-0">done</span>
      )}
    </div>
  )
}
