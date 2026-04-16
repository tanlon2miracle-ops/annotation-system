import { Code } from 'lucide-react'
import type { ModelData } from '../../types'

export default function SchemaTab({ model }: { model: ModelData }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm bg-indigo-500" /> Request Payload
          </h4>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-sm overflow-x-auto shadow-inner">
            <pre className="text-indigo-700">{JSON.stringify(model.input_schema, null, 2)}</pre>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm bg-emerald-500" /> Response Format
          </h4>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 font-mono text-sm overflow-x-auto shadow-inner">
            <pre className="text-emerald-700">{JSON.stringify(model.output_schema, null, 2)}</pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Code className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-indigo-900">统一网关接入点</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-1 bg-white text-indigo-700 text-xs font-bold rounded shadow-sm">POST</span>
            <code className="text-sm text-indigo-800">https://api.internal.com/v1/router/invoke</code>
          </div>
          <p className="text-xs text-indigo-600/80 mt-2 font-mono">
            {'// 必须在 HTTP Headers 中附带参数'}
            <br />
            X-Model-Id: {model.model_id}
          </p>
        </div>
      </div>
    </div>
  )
}
