import { useAnnotationStore } from '../../stores/annotationStore'
import { ChatContext } from './ChatContext'
import { MediaRenderer } from './MediaRenderer'

export function ItemViewer() {
  const { items, currentIndex, mode } = useAnnotationStore()
  const item = items[currentIndex]

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        暂无数据
      </div>
    )
  }

  return (
    <div className="overflow-y-auto p-4 space-y-4 glass rounded-xl">
      <div className="flex flex-wrap gap-2">
        <Tag label="event_id" value={item.event_id} />
        <Tag label="uid" value={item.uid} />
        {item.mall_id && <Tag label="mall_id" value={item.mall_id} />}
        <Tag label="type" value={item.text_type} />
      </div>

      {item.chat_list && <ChatContext content={item.chat_list} />}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-xs text-gray-400 mb-2">当前输入</div>
        <MediaRenderer text={item.text} textType={item.text_type} />
      </div>

      {mode !== 'independent' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <div className="text-xs text-gray-400 mb-2">模型标注结果</div>
          <div className="flex gap-3">
            <ResultBadge label="Model 1" value={item.result} />
            <ResultBadge label="Model 2" value={item.result_2} />
            {item.vote_result && (
              <ResultBadge label="投票" value={item.vote_result} />
            )}
          </div>
          {item.reason && (
            <div className="text-xs text-gray-500 mt-1">
              原始 Reason: <span className="font-medium">{item.reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </span>
  )
}

function ResultBadge({ label, value }: { label: string; value: string | null }) {
  const isYes = value === '是' || value?.toLowerCase() === 'yes'
  const isNo = value === '否' || value?.toLowerCase() === 'no'
  const color = isYes ? 'bg-green-100 text-green-800' : isNo ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${color}`}>
      <span className="text-xs opacity-60">{label}</span>
      {value ?? '-'}
    </span>
  )
}
