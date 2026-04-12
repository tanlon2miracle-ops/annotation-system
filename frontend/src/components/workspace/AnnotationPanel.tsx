import { useAnnotationStore } from '../../stores/annotationStore'
import { useSessionStore } from '../../stores/sessionStore'
import { useUIStore } from '../../stores/uiStore'

export function AnnotationPanel() {
  const store = useAnnotationStore()
  const sessionStore = useSessionStore()
  const { reasons } = useUIStore()
  const item = store.items[store.currentIndex]

  if (!item && !store.batchMode) {
    return <div className="glass rounded-xl" />
  }

  const ann = item?.annotation

  if (store.batchMode) {
    return <BatchPanel />
  }

  return (
    <div className="flex flex-col glass rounded-xl p-4 space-y-4 overflow-y-auto">
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">判断</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`py-3 rounded-lg text-sm font-bold transition-all ${
              store.draftResult === '是'
                ? 'bg-green-500 text-white ring-2 ring-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-green-50'
            }`}
            onClick={() => store.setResult('是')}
          >
            YES
            <span className="block text-xs font-normal opacity-60 mt-0.5">Y</span>
          </button>
          <button
            className={`py-3 rounded-lg text-sm font-bold transition-all ${
              store.draftResult === '否'
                ? 'bg-red-500 text-white ring-2 ring-red-300'
                : 'bg-gray-100 text-gray-700 hover:bg-red-50'
            }`}
            onClick={() => store.setResult('否')}
          >
            NO
            <span className="block text-xs font-normal opacity-60 mt-0.5">N</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Reason</div>
        <div className="space-y-1">
          {reasons.map((r, i) => (
            <button
              key={r.id}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                store.draftReason === r.value
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => store.setReason(r.value)}
            >
              <span className="text-xs text-gray-400 mr-1.5">{i + 1}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">备注 (可选)</div>
        <textarea
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none h-16"
          placeholder="添加备注..."
          value={store.draftNotes}
          onChange={(e) => store.setNotes(e.target.value)}
        />
      </div>

      <div className="space-y-2 mt-auto pt-4 border-t border-gray-100">
        <button
          className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!store.draftResult}
          onClick={() => {
            store.confirmAndNext().then(() => {
              if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
            })
          }}
        >
          确认 & 下一条
          <span className="text-xs opacity-60 ml-2">Enter</span>
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="bg-yellow-50 text-yellow-700 py-2 rounded-md text-sm hover:bg-yellow-100"
            onClick={() => {
              store.skipItem().then(() => {
                if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
              })
            }}
          >
            跳过 <span className="text-xs opacity-60">S</span>
          </button>
          <button
            className={`py-2 rounded-md text-sm ${
              ann?.is_flagged
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => store.flagItem()}
          >
            {ann?.is_flagged ? '取消标记' : '标记'}
            <span className="text-xs opacity-60 ml-1">F</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function BatchPanel() {
  const store = useAnnotationStore()
  const sessionStore = useSessionStore()
  const { reasons } = useUIStore()
  const count = store.selectedIds.size

  return (
    <div className="flex flex-col glass rounded-xl p-4 space-y-4 overflow-y-auto">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
        <div className="text-sm font-medium text-indigo-800">批量标注模式</div>
        <div className="text-xs text-indigo-600 mt-1">
          已选择 <span className="font-bold text-indigo-800">{count}</span> 条
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">统一判断</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            className={`py-3 rounded-lg text-sm font-bold transition-all ${
              store.draftResult === '是'
                ? 'bg-green-500 text-white ring-2 ring-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-green-50'
            }`}
            onClick={() => store.setResult('是')}
          >
            全部 YES
          </button>
          <button
            className={`py-3 rounded-lg text-sm font-bold transition-all ${
              store.draftResult === '否'
                ? 'bg-red-500 text-white ring-2 ring-red-300'
                : 'bg-gray-100 text-gray-700 hover:bg-red-50'
            }`}
            onClick={() => store.setResult('否')}
          >
            全部 NO
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">统一 Reason</div>
        <div className="space-y-1">
          {reasons.map((r, i) => (
            <button
              key={r.id}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${
                store.draftReason === r.value
                  ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => store.setReason(r.value)}
            >
              <span className="text-xs text-gray-400 mr-1.5">{i + 1}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-auto pt-4 border-t border-gray-100">
        <button
          className="w-full bg-indigo-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!store.draftResult || count === 0}
          onClick={() => {
            store.batchAnnotate(store.draftResult!, store.draftReason).then(() => {
              if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
            })
          }}
        >
          批量提交 ({count} 条)
        </button>
        <button
          className="w-full bg-yellow-50 text-yellow-700 py-2 rounded-md text-sm hover:bg-yellow-100 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={count === 0}
          onClick={() => {
            store.batchSkip().then(() => {
              if (store.sessionId) sessionStore.fetchProgress(store.sessionId)
            })
          }}
        >
          批量跳过 ({count} 条)
        </button>
      </div>
    </div>
  )
}
