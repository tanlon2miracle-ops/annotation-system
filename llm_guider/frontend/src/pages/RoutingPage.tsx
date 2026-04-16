import { useState } from 'react'
import { Sparkles, SlidersHorizontal, Search, Zap } from 'lucide-react'
import { useRoutingStore } from '../stores/routingStore'
import { useUIStore } from '../stores/uiStore'
import ModelCard from '../components/registry/ModelCard'
import ModelDrawer from '../components/detail/ModelDrawer'
import { getModalityConfig, MODALITIES } from '../components/registry/modalityConfig'

type Tab = 'nl' | 'rule'

export default function RoutingPage() {
  const [tab, setTab] = useState<Tab>('nl')
  const [nlQuery, setNlQuery] = useState('')
  const [ruleModality, setRuleModality] = useState('all')
  const [ruleTags, setRuleTags] = useState('')
  const [ruleMaxLatency, setRuleMaxLatency] = useState('')
  const [ruleMinQps, setRuleMinQps] = useState('')

  const routingResult = useRoutingStore((s) => s.routingResult)
  const isRouting = useRoutingStore((s) => s.isRouting)
  const routeByNL = useRoutingStore((s) => s.routeByNL)
  const routeByRule = useRoutingStore((s) => s.routeByRule)
  const openDrawer = useUIStore((s) => s.openDrawer)

  const handleNLRoute = () => {
    if (nlQuery.trim()) routeByNL(nlQuery.trim())
  }

  const handleRuleRoute = () => {
    routeByRule({
      modality: ruleModality === 'all' ? undefined : ruleModality,
      tags: ruleTags ? ruleTags.split(/[,，\s]+/).filter(Boolean) : [],
      max_latency_ms: ruleMaxLatency ? Number(ruleMaxLatency) : undefined,
      min_qps: ruleMinQps ? Number(ruleMinQps) : undefined,
      status: 'healthy',
    })
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">智能路由</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tab switch */}
            <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setTab('nl')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  tab === 'nl' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-4 h-4" /> 自然语言
              </button>
              <button
                onClick={() => setTab('rule')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  tab === 'rule' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" /> 规则筛选
              </button>
            </div>

            {tab === 'nl' ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <label className="text-sm font-bold text-slate-700">描述你的需求</label>
                <textarea
                  value={nlQuery}
                  onChange={(e) => setNlQuery(e.target.value)}
                  placeholder="例如：我需要一个检测评论垃圾信息的文本模型，延迟要低..."
                  className="w-full h-32 border border-slate-200 rounded-xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={handleNLRoute}
                  disabled={isRouting || !nlQuery.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/30"
                >
                  <Search className="w-4 h-4" />
                  {isRouting ? '匹配中...' : '智能匹配'}
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">模型类型</label>
                  <div className="flex flex-wrap gap-2">
                    {MODALITIES.map((mod) => (
                      <button
                        key={mod}
                        onClick={() => setRuleModality(mod)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          ruleModality === mod
                            ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {mod === 'all' ? '全部' : getModalityConfig(mod).label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block">标签（逗号分隔）</label>
                  <input
                    value={ruleTags}
                    onChange={(e) => setRuleTags(e.target.value)}
                    placeholder="风控, NLP"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">最大延迟 (ms)</label>
                    <input
                      type="number"
                      value={ruleMaxLatency}
                      onChange={(e) => setRuleMaxLatency(e.target.value)}
                      placeholder="500"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">最小 QPS</label>
                    <input
                      type="number"
                      value={ruleMinQps}
                      onChange={(e) => setRuleMinQps(e.target.value)}
                      placeholder="100"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <button
                  onClick={handleRuleRoute}
                  disabled={isRouting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-sm shadow-indigo-600/30"
                >
                  <Zap className="w-4 h-4" />
                  {isRouting ? '筛选中...' : '规则匹配'}
                </button>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2">
            {routingResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">
                    匹配结果 <span className="text-sm font-normal text-slate-400">({routingResult.matches.length} 个模型)</span>
                  </h2>
                </div>
                {routingResult.matches.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-500">未找到符合条件的模型</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {routingResult.matches.map((match, i) => (
                      <div key={match.model.id} className="relative">
                        <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center z-10">
                          {i + 1}
                        </div>
                        <div className="ml-4">
                          <div className="mb-2 flex items-center gap-3">
                            <span className="text-sm font-bold text-indigo-600">{match.score} 分</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {match.match_reasons.map((r, ri) => (
                                <span key={ri} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ModelCard model={match.model} onClick={() => openDrawer(match.model)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">输入需求描述或设置筛选条件</p>
                <p className="text-sm text-slate-400 mt-1">系统将为您推荐最适合的模型</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <ModelDrawer />
    </>
  )
}
