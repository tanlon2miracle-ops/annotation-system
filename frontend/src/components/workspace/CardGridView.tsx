import { useState, useCallback } from 'react'
import { useAnnotationStore } from '../../stores/annotationStore'

import { MediaRenderer } from './MediaRenderer'
import { InlineAnnotation } from './InlineAnnotation'
import type { AnnotationData, ItemData } from '../../types'

export function CardGridView() {
  const items = useAnnotationStore(s => s.items)
  const mode = useAnnotationStore(s => s.mode)
  const batchMode = useAnnotationStore(s => s.batchMode)
  const selectedIds = useAnnotationStore(s => s.selectedIds)
  const toggleSelect = useAnnotationStore(s => s.toggleSelect)
  const totalItems = useAnnotationStore(s => s.totalItems)
  const currentPage = useAnnotationStore(s => s.currentPage)
  const pageSize = useAnnotationStore(s => s.pageSize)
  const loadItems = useAnnotationStore(s => s.loadItems)

  const handleAnnotationUpdated = useCallback((itemId: number, ann: AnnotationData) => {
    const updated = items.map(item =>
      item.id === itemId ? { ...item, annotation: ann } : item
    )
    useAnnotationStore.setState({ items: updated })
  }, [items])

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            mode={mode}
            batchMode={batchMode}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelect(item.id)}
            onAnnotationUpdated={handleAnnotationUpdated}
          />
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6 mb-2">
          <button
            className="px-4 py-1.5 text-sm glass rounded-lg hover:bg-white/80 disabled:opacity-40"
            disabled={currentPage <= 1}
            onClick={() => loadItems(currentPage - 1)}
          >
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)} / {totalItems}
          </span>
          <button
            className="px-4 py-1.5 text-sm glass rounded-lg hover:bg-white/80 disabled:opacity-40"
            disabled={currentPage * pageSize >= totalItems}
            onClick={() => loadItems(currentPage + 1)}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

function statusBadge(item: ItemData) {
  const ann = item.annotation
  if (!ann) return { text: '待标注', cls: 'bg-gray-500/10 text-gray-500' }
  if (ann.is_flagged) return { text: '已标记', cls: 'bg-red-500/15 text-red-600' }
  if (ann.is_skipped) return { text: '已跳过', cls: 'bg-yellow-500/15 text-yellow-700' }
  if (ann.result) return { text: '已标注', cls: 'bg-green-500/15 text-green-700' }
  return { text: '待标注', cls: 'bg-gray-500/10 text-gray-500' }
}

interface ItemCardProps {
  item: ItemData
  mode: string
  batchMode: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onAnnotationUpdated: (itemId: number, ann: AnnotationData) => void
}

function ItemCard({ item, mode, batchMode, isSelected, onToggleSelect, onAnnotationUpdated }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false)
  const badge = statusBadge(item)

  return (
    <div className={`glass rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-black/5 ${
      isSelected ? 'ring-2 ring-indigo-300 border-indigo-300' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/40 border-b border-white/30">
        {batchMode && (
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={isSelected}
            onChange={onToggleSelect}
          />
        )}
        <span className="text-xs font-mono text-gray-500">#{item.id}</span>
        <span className="text-xs text-gray-700 font-medium truncate">{item.event_id}</span>
        <span className="ml-auto">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.text}
          </span>
        </span>
      </div>

      {/* Media */}
      <div className="px-3 pt-3">
        <div className="max-h-48 overflow-hidden rounded-lg border border-white/30">
          <MediaRenderer text={item.text} textType={item.text_type} />
        </div>
      </div>

      {/* Chat context (collapsible) */}
      {item.chat_list && (
        <div className="px-3 pt-2">
          <button
            className="text-xs text-blue-500 hover:text-blue-700"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起上下文 ▲' : '展开上下文 ▼'}
          </button>
          {expanded && (
            <div className="mt-1 text-xs text-gray-600 bg-white/40 rounded-lg p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
              {item.chat_list}
            </div>
          )}
        </div>
      )}

      {/* Model results */}
      {mode !== 'independent' && (
        <div className="flex gap-1.5 px-3 pt-2">
          <MiniResultBadge label="M1" value={item.result} />
          <MiniResultBadge label="M2" value={item.result_2} />
          {item.reason && (
            <span className="text-[10px] text-gray-400 ml-1 self-center">{item.reason}</span>
          )}
        </div>
      )}

      {/* Inline annotation */}
      <div className="px-3 py-2">
        <InlineAnnotation item={item} onUpdated={onAnnotationUpdated} />
      </div>
    </div>
  )
}

function MiniResultBadge({ label, value }: { label: string; value: string | null }) {
  const isYes = value === '是' || value?.toLowerCase() === 'yes'
  const isNo = value === '否' || value?.toLowerCase() === 'no'
  const color = isYes ? 'bg-green-100 text-green-700' : isNo ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color}`}>
      {label}:{value ?? '-'}
    </span>
  )
}
