import { SlidersHorizontal } from 'lucide-react'
import { getModalityConfig, MODALITIES } from './modalityConfig'

interface Props {
  selected: string
  onSelect: (m: string) => void
}

export default function ModalityFilter({ selected, onSelect }: Props) {
  return (
    <aside className="w-full md:w-56 flex-shrink-0 space-y-8">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> 筛选条件
        </h3>
        <div className="space-y-1">
          {MODALITIES.map((mod) => (
            <button
              key={mod}
              onClick={() => onSelect(mod)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                selected === mod
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {mod === 'all' ? '全部能力 (All)' : getModalityConfig(mod).label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
