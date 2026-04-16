import { Sparkles } from 'lucide-react'
import { useSmartRoutingStore } from '../../stores/smartRoutingStore'

const EXAMPLES = [
  '帮我检测这张图片是否含有违规内容',
  '分析这段评论是否为垃圾信息',
  '我需要一个意图解析模型来理解用户查询',
  '直播间画面实时审核',
]

export default function QueryInput() {
  const query = useSmartRoutingStore((s) => s.query)
  const status = useSmartRoutingStore((s) => s.status)
  const setQuery = useSmartRoutingStore((s) => s.setQuery)
  const startRouting = useSmartRoutingStore((s) => s.startRouting)
  const isRunning = status === 'routing' || status === 'invoking'

  const handleSubmit = () => {
    if (query.trim() && !isRunning) startRouting()
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <label className="text-sm font-bold text-slate-700">描述你的需求，AI 将为你选择最合适的模型</label>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        placeholder="例如：帮我检测一张商品图片是否含有违规内容..."
        className="w-full h-28 border border-slate-200 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      />
      <button
        onClick={handleSubmit}
        disabled={isRunning || !query.trim()}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/30"
      >
        <Sparkles className="w-4 h-4" />
        {isRunning ? '路由中...' : '智能路由'}
      </button>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="text-xs bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
