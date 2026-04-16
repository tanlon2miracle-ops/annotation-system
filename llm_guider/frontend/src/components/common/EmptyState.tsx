import { Search } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="text-center py-24 bg-white border border-dashed border-slate-200 rounded-2xl">
      <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">未找到匹配的模型能力</p>
      <p className="text-sm text-slate-400 mt-1">请尝试更换检索关键词或联系算法团队</p>
    </div>
  )
}
