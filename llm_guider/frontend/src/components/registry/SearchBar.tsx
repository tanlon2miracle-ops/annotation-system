import { Search } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <div className="relative flex items-center bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
        <Search className="w-5 h-5 text-slate-400 mr-3" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="搜索模型名称、标签，或输入自然语言需求让智能路由为您匹配..."
          className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-sm"
        />
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
          <kbd className="font-sans font-medium">⌘</kbd> <kbd className="font-sans font-medium">K</kbd>
        </div>
      </div>
    </div>
  )
}
