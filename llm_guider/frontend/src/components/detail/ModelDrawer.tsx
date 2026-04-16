import { X, BookOpen, Terminal } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { getModalityConfig } from '../registry/modalityConfig'
import SchemaTab from './SchemaTab'
import PlaygroundTab from './PlaygroundTab'

export default function ModelDrawer() {
  const model = useUIStore((s) => s.selectedModel)
  const tab = useUIStore((s) => s.drawerTab)
  const close = useUIStore((s) => s.closeDrawer)
  const setTab = useUIStore((s) => s.setDrawerTab)

  if (!model) return null

  const cfg = getModalityConfig(model.modality)

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity"
        onClick={close}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.color} ${cfg.border}`}
              >
                {model.modality}
              </span>
              <span className="text-xs text-slate-400 font-mono bg-white px-2 py-0.5 border border-slate-200 rounded-md shadow-sm">
                Owner: {model.owner}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{model.name}</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{model.description}</p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-8 bg-white">
          <button
            onClick={() => setTab('schema')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'schema' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 接口契约
          </button>
          <button
            onClick={() => setTab('playground')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              tab === 'playground' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" /> 快速测试
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {tab === 'schema' ? <SchemaTab model={model} /> : <PlaygroundTab />}
        </div>
      </div>
    </>
  )
}
