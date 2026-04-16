import { useEffect } from 'react'
import { useRoutingStore } from '../stores/routingStore'

export default function LogsPage() {
  const logs = useRoutingStore((s) => s.routingLogs)
  const totalLogs = useRoutingStore((s) => s.totalLogs)
  const fetchLogs = useRoutingStore((s) => s.fetchLogs)

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        路由日志 <span className="text-sm font-normal text-slate-400">({totalLogs} 条记录)</span>
      </h1>

      {logs.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-500 font-medium">暂无路由记录</p>
          <p className="text-sm text-slate-400 mt-1">使用智能路由后，记录将出现在这里</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">类型</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">查询内容</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">推荐模型</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">候选数</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                        log.query_type === 'nl'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-teal-50 text-teal-600'
                      }`}
                    >
                      {log.query_type === 'nl' ? '自然语言' : '规则'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-xs truncate">{log.query_text}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {log.selected_model_id || '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{log.matched_model_ids.length}</td>
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
