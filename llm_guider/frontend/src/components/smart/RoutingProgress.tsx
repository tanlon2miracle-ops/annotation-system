import { Brain, Cpu, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'
import { useSmartRoutingStore } from '../../stores/smartRoutingStore'

export default function RoutingProgress() {
  const status = useSmartRoutingStore((s) => s.status)
  const reasoning = useSmartRoutingStore((s) => s.reasoning)
  const selectedModels = useSmartRoutingStore((s) => s.selectedModels)
  const invocationResults = useSmartRoutingStore((s) => s.invocationResults)
  const error = useSmartRoutingStore((s) => s.error)
  const totalLatencyMs = useSmartRoutingStore((s) => s.totalLatencyMs)

  if (status === 'idle') return null

  return (
    <div className="space-y-4">
      {/* Reasoning */}
      {(status === 'routing' && !reasoning) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-indigo-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-semibold">AI 正在分析你的需求...</span>
          </div>
        </div>
      )}

      {reasoning && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-700">AI 推理</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{reasoning}</p>
        </div>
      )}

      {/* Selected Models */}
      {selectedModels.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-700">
              选中模型 ({selectedModels.length})
            </span>
          </div>
          <div className="space-y-3">
            {selectedModels.map((m) => {
              const result = invocationResults.find((r) => r.model_id === m.model_id)
              return (
                <div
                  key={m.model_id}
                  className="border border-slate-100 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result ? (
                        result.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )
                      ) : status === 'invoking' ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      ) : null}
                      <span className="text-sm font-semibold text-slate-900">{m.model_name}</span>
                      <span className="text-xs text-slate-400 font-mono">{m.model_id}</span>
                    </div>
                    {result && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.latency_ms}ms
                      </span>
                    )}
                  </div>

                  {/* Invocation result */}
                  {result && result.success && (
                    <pre className="bg-slate-50 rounded-lg p-3 text-xs text-slate-700 overflow-x-auto max-h-48">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  )}
                  {result && !result.success && (
                    <div className="bg-red-50 rounded-lg p-3 text-xs text-red-600">
                      {result.error_message || '调用失败'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed summary */}
      {status === 'completed' && totalLatencyMs != null && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            路由完成，总耗时 {totalLatencyMs}ms
          </span>
        </div>
      )}

      {/* Error */}
      {status === 'error' && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">{error}</span>
        </div>
      )}
    </div>
  )
}
