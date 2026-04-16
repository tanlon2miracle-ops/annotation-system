import { CheckCircle2, AlertCircle, Zap, Clock } from 'lucide-react'
import Badge from '../common/Badge'
import { getModalityConfig } from './modalityConfig'
import type { ModelData } from '../../types'

interface Props {
  model: ModelData
  onClick: () => void
}

export default function ModelCard({ model, onClick }: Props) {
  const config = getModalityConfig(model.modality)
  const ModIcon = config.icon

  return (
    <div
      onClick={onClick}
      className="group bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-300 flex flex-col"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl ${config.bg} ring-1 ring-inset ${config.border}`}>
            <ModIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {model.name}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">{model.model_id}</p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border ${
            model.status === 'healthy'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : model.status === 'warning'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {model.status === 'healthy' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          {model.status === 'healthy' ? 'Active' : model.status === 'warning' ? 'Warning' : 'Offline'}
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-5 leading-relaxed flex-1">
        {model.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex flex-wrap gap-2">
          {model.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} className="bg-slate-100 text-slate-600 border-slate-200">
              {tag}
            </Badge>
          ))}
          {model.tags.length > 2 && (
            <Badge className="bg-slate-50 text-slate-400 border-slate-200">
              +{model.tags.length - 2}
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-slate-400" /> {model.qps}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> {model.latency_ms}ms
          </span>
        </div>
      </div>
    </div>
  )
}
