import { useEffect, useState } from 'react'
import { api } from '../api/client'

interface SessionLog {
  id: number
  user_query: string
  llm_model: string
  selected_models: { model_id: string; model_name: string; reason: string }[]
  status: string
  total_llm_latency_ms: number
  total_invoke_latency_ms: number
  created_at: string
}

interface PaginatedSessions {
  items: SessionLog[]
  total: number
  page: number
  page_size: number
}

export default function LogsPage() {
  const [data, setData] = useState<PaginatedSessions | null>(null)

  useEffect(() => {
    api.get<PaginatedSessions>('/route/smart/history').then(setData)
  }, [])

  const logs = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        路由日志 <span className="text-sm font-normal text-slate-400">({total} 条记录)</span>
      </h1>

      {logs.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium">暂无路由记录</p>
          <p className="text-sm text-slate-400 mt-1">使用 AI 路由后，记录将出现在这里</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">查询内容</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">选中模型</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">耗时</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-700 max-w-xs truncate">{log.user_query}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {log.selected_models.length > 0
                      ? log.selected_models.map((m) => m.model_name).join(', ')
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        log.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : log.status === 'error'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {log.total_llm_latency_ms + log.total_invoke_latency_ms}ms
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
