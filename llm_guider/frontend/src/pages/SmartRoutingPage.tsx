import { Sparkles, Search } from 'lucide-react'
import QueryInput from '../components/smart/QueryInput'
import RoutingProgress from '../components/smart/RoutingProgress'
import { useSmartRoutingStore } from '../stores/smartRoutingStore'

export default function SmartRoutingPage() {
  const status = useSmartRoutingStore((s) => s.status)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-slate-900">AI 智能路由</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input */}
        <div className="lg:col-span-1">
          <QueryInput />
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {status === 'idle' ? (
            <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">描述你的需求</p>
              <p className="text-sm text-slate-400 mt-1">AI 将自动选择最合适的模型并发起调用</p>
            </div>
          ) : (
            <RoutingProgress />
          )}
        </div>
      </div>
    </div>
  )
}
