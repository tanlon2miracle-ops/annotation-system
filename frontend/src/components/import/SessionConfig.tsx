import { useState } from 'react'
import type { AnnotationMode, BatchData } from '../../types'

interface SessionConfigProps {
  batch: BatchData
  onStart: (name: string, mode: AnnotationMode) => void
}

const MODES: { value: AnnotationMode; label: string; desc: string; color: string }[] = [
  { value: 'review_correct', label: '审核修正', desc: '审核模型标注，纠正错误', color: 'border-blue-500 bg-blue-50' },
  { value: 'independent', label: '独立标注', desc: '隐藏模型结果，独立判断', color: 'border-green-500 bg-green-50' },
  { value: 'arbitration', label: '投票仲裁', desc: '仅处理两模型不一致的条目', color: 'border-amber-500 bg-amber-50' },
]

export function SessionConfig({ batch, onStart }: SessionConfigProps) {
  const [name, setName] = useState(`${batch.filename} - Session`)
  const [mode, setMode] = useState<AnnotationMode>('review_correct')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-medium text-gray-700">创建标注会话</h3>

      <div className="text-sm text-gray-500">
        已导入 <span className="font-medium text-gray-900">{batch.item_count}</span> 条数据
        (Batch #{batch.id})
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">会话名称</label>
        <input
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">标注模式</label>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              className={`border-2 rounded-lg p-3 text-left transition-all ${
                mode === m.value ? m.color : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMode(m.value)}
            >
              <div className="text-sm font-medium text-gray-900">{m.label}</div>
              <div className="text-xs text-gray-500 mt-1">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-800"
        onClick={() => onStart(name, mode)}
      >
        开始标注
      </button>
    </div>
  )
}
