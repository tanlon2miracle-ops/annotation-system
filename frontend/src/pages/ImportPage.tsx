import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileUploader } from '../components/import/FileUploader'
import { ImportPreview } from '../components/import/ImportPreview'
import { SessionConfig } from '../components/import/SessionConfig'
import type { BatchData, AnnotationMode } from '../types'
import { uploadFile } from '../api/client'
import { api } from '../api/client'

export function ImportPage() {
  const navigate = useNavigate()
  const [batch, setBatch] = useState<BatchData | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('JSON 必须是数组')
      setPreviewData(parsed.slice(0, 20))

      const result = await uploadFile('/import', file) as BatchData
      setBatch(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '导入失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleStart = useCallback(async (name: string, mode: AnnotationMode) => {
    if (!batch) return
    try {
      const session = await api.post<{ id: number }>('/sessions', {
        name,
        mode,
        batch_id: batch.id,
      })
      navigate(`/workspace/${session.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '创建会话失败')
    }
  }, [batch, navigate])

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 drop-shadow-sm">导入数据</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <FileUploader onFile={handleFile} loading={loading} />

      {previewData.length > 0 && <ImportPreview data={previewData} />}

      {batch && (
        <SessionConfig
          batch={batch}
          onStart={handleStart}
        />
      )}
    </div>
  )
}
