import { useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useAnnotationStore } from '../../stores/annotationStore'

function statusDot(item: { annotation: { is_skipped: boolean; is_flagged: boolean; result: string | null } | null }) {
  const ann = item.annotation
  if (!ann) return 'bg-gray-300'
  if (ann.is_flagged) return 'bg-red-500'
  if (ann.is_skipped) return 'bg-yellow-500'
  if (ann.result) return 'bg-green-500'
  return 'bg-gray-300'
}

export function ItemList() {
  const {
    items, currentIndex, setCurrentIndex, totalItems,
    batchMode, selectedIds, toggleSelect, selectAll, deselectAll, toggleBatchMode,
  } = useAnnotationStore()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  useEffect(() => {
    if (!batchMode) {
      virtualizer.scrollToIndex(currentIndex, { align: 'center' })
    }
  }, [currentIndex, virtualizer, batchMode])

  const annotatedCount = items.filter(i => i.annotation && !i.annotation.is_skipped).length
  const allSelected = items.length > 0 && selectedIds.size === items.length

  return (
    <div className="flex flex-col glass rounded-xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/30 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {annotatedCount} / {totalItems} 已标注
          </span>
          <button
            className={`text-xs px-2 py-0.5 rounded transition-colors ${
              batchMode
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            onClick={toggleBatchMode}
          >
            {batchMode ? '退出批量' : '批量模式'}
          </button>
        </div>
        {batchMode && (
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-blue-600 hover:text-blue-800"
              onClick={allSelected ? deselectAll : selectAll}
            >
              {allSelected ? '取消全选' : '全选当页'}
            </button>
            <span className="text-xs text-gray-400">
              已选 {selectedIds.size} 条
            </span>
          </div>
        )}
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index]
            const isActive = virtualRow.index === currentIndex
            const isSelected = selectedIds.has(item.id)
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className={`absolute top-0 left-0 w-full flex items-center px-3 py-2 cursor-pointer border-b border-gray-50 text-xs ${
                  isSelected ? 'bg-indigo-50' : isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
                onClick={() => {
                  if (batchMode) {
                    toggleSelect(item.id)
                  } else {
                    setCurrentIndex(virtualRow.index)
                  }
                }}
              >
                {batchMode && (
                  <input
                    type="checkbox"
                    className="mr-2 shrink-0 accent-indigo-600"
                    checked={isSelected}
                    readOnly
                  />
                )}
                <span className={`w-2 h-2 rounded-full shrink-0 mr-2 ${statusDot(item)}`} />
                <span className="truncate text-gray-700 flex-1">
                  {item.text?.slice(0, 40) || item.event_id}
                </span>
                <span className="text-gray-400 ml-1 shrink-0">#{item.id}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
