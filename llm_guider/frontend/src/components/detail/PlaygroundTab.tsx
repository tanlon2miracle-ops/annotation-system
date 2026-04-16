import { Play, Activity, CheckCircle2 } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

export default function PlaygroundTab() {
  const input = useUIStore((s) => s.playgroundInput)
  const setInput = useUIStore((s) => s.setPlaygroundInput)
  const result = useUIStore((s) => s.playgroundResult)
  const isSimulating = useUIStore((s) => s.isSimulating)
  const run = useUIStore((s) => s.runPlayground)

  return (
    <div className="h-full flex flex-col space-y-5">
      <div className="flex-1 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Input Data (JSON)</span>
        </div>
        <textarea
          className="flex-1 bg-transparent p-5 text-sm font-mono text-slate-700 resize-none outline-none min-h-[120px]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={run}
          disabled={isSimulating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-600/20 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/30"
        >
          {isSimulating ? <Activity className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isSimulating ? '推理中...' : '发送测试请求'}
        </button>
      </div>

      <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50 shadow-inner flex flex-col overflow-hidden relative">
        <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output Result</span>
          {result && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {result.status_code} OK · {result.latency_ms}ms
            </span>
          )}
        </div>
        <div className="flex-1 p-5 overflow-auto bg-slate-50">
          {isSimulating ? (
            <div className="h-full flex items-center justify-center space-x-2">
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
            </div>
          ) : result ? (
            <pre className="text-sm font-mono text-slate-700">
              {JSON.stringify(result.output, null, 2)}
            </pre>
          ) : (
            <pre className="text-sm font-mono text-slate-400">
              {'// 点击发送按钮以获取路由推理结果...'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
